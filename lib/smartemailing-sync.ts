import 'server-only'
import { randomUUID } from 'node:crypto'
import { db } from '@/prisma/db'
import { createSmartEmailClient, normalizeSmartContact, normalizeSmartEvent, object, SmartEmailSyncError, type SmartEmailSettings } from '@/lib/smartemailing-api'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
const syncId = 'smartemailing'

export async function syncSmartEmailing(settings: SmartEmailSettings) {
    const token = randomUUID(), started = new Date().toISOString()
    await db.runtime().query(db.raw.sql`INSERT INTO public."SmartEmailSync" (id, "streamId", "contactOffset")
        VALUES (${syncId}, ${settings.streamId}, 0) ON CONFLICT (id) DO NOTHING`.affectedCount().build())
    const locked = await db.runtime().query(db.raw.sql`UPDATE public."SmartEmailSync"
        SET "lockToken" = ${token}, "lockUntil" = now() + interval '10 minutes', "lastAttemptAt" = ${started}::timestamptz
        WHERE id = ${syncId} AND ("lockUntil" IS NULL OR "lockUntil" < now()) RETURNING id`
        .returnsRow({ id: { codecId: 'pg/text@1' } }).build())
    if (!locked.length) return { busy: true, more: true }
    const api = createSmartEmailClient(settings)
    // Commit each page before advancing the provider cursor. A failed ACK is safe to replay.
    async function savePage(work: (tx: Transaction) => Promise<void>) {
        await db.transaction(async tx => {
            const rows = await tx.query(db.raw.sql`SELECT id FROM public."SmartEmailSync" WHERE id = ${syncId}
                AND "lockToken" = ${token} AND "lockUntil" > now() FOR UPDATE`.returnsRow({ id: { codecId: 'pg/text@1' } }).build())
            if (!rows.length) throw new SmartEmailSyncError('Sync lease expired; another worker may have taken over.')
            await work(tx)
            await tx.orm.public.SmartEmailSync.where({ id: syncId }).update({ lockUntil: new Date(Date.now() + 600_000).toISOString() })
        })
    }
    try {
        const state = (await db.orm.public.SmartEmailSync.where({ id: syncId }).first())!
        if (state.streamId !== settings.streamId) throw new SmartEmailSyncError('The configured stream changed. IT must review the saved integration state before switching accounts or streams.')
        const deadline = Date.now() + 210_000
        let moreContacts = false, contactsRead = 0
        // A backfill can need many runs; refresh contact memberships only once per UTC day.
        const refreshContacts = state.contactOffset > 0 || !state.contactsSyncedAt || new Date(state.contactsSyncedAt).toISOString().slice(0, 10) !== started.slice(0, 10)
        if (refreshContacts) {
            const lists = new Map<number, string>()
            for (let offset = 0; ; offset += 500) {
                if (Date.now() > deadline) throw new SmartEmailSyncError('List download exceeded the sync time limit. Retry later.')
                const page = await api.lists(offset)
                for (const value of page.rows) {
                    const list = object(value)
                    if (!Number.isSafeInteger(list.id) || typeof list.name !== 'string') throw new SmartEmailSyncError('Invalid SmartEmailing list.')
                    lists.set(list.id as number, list.name.slice(0, 1000))
                }
                if (!page.more) break
            }
            const generation = state.contactsStartedAt ?? started
            let contactOffset = state.contactOffset
            moreContacts = true
            for (let batch = 0; batch < 5 && Date.now() < deadline; batch++) {
                const page = await api.contacts(contactOffset)
                const profiles = page.rows.map(row => normalizeSmartContact(row, lists, generation))
                contactOffset += profiles.length; contactsRead += profiles.length; moreContacts = page.more
                await savePage(async tx => {
                    // One bulk write avoids a database round trip for every teacher.
                    if (profiles.length) await tx.query(db.raw.sql`INSERT INTO public."SmartEmailContact" (id, email, "listsJson", "hardBounced", "softBounces", blacklisted, "syncedAt")
                        SELECT * FROM jsonb_to_recordset(${JSON.stringify(profiles)}::jsonb) AS x
                        (id integer, email text, "listsJson" text, "hardBounced" boolean, "softBounces" integer, blacklisted boolean, "syncedAt" timestamptz)
                        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, "listsJson" = EXCLUDED."listsJson",
                        "hardBounced" = EXCLUDED."hardBounced", "softBounces" = EXCLUDED."softBounces",
                        blacklisted = EXCLUDED.blacklisted, "syncedAt" = EXCLUDED."syncedAt"`.affectedCount().build())
                    await tx.orm.public.SmartEmailSync.where({ id: syncId }).update({ contactOffset: page.more ? contactOffset : 0,
                        contactsStartedAt: page.more ? generation : null, ...(page.more ? {} : { contactsSyncedAt: generation }) })
                })
                if (!page.more) break
            }
        }
        let moreEvents = true, eventsRead = 0
        for (let batch = 0; batch < 10 && Date.now() < deadline; batch++) {
            const response = object(await api.events()), meta = object(response.meta)
            if (response.status !== 'ok' || !Array.isArray(response.data) || typeof meta.has_more !== 'boolean' || (meta.cursor !== null && typeof meta.cursor !== 'string')) throw new SmartEmailSyncError('Invalid SmartEmailing event batch.')
            const events = response.data.map(normalizeSmartEvent).filter(event => event !== null)
            if (response.data.length && !meta.cursor) throw new SmartEmailSyncError('SmartEmailing event batch has no acknowledgement cursor.')
            await savePage(async tx => {
                if (events.length) await tx.query(db.raw.sql`INSERT INTO public."SmartEmailEvent" (id, email, "messageId", type, "occurredAt", "campaignName", subject, "campaignType", "detailsJson")
                    SELECT * FROM jsonb_to_recordset(${JSON.stringify(events)}::jsonb) AS x
                    (id text, email text, "messageId" text, type text, "occurredAt" timestamptz, "campaignName" text, subject text, "campaignType" text, "detailsJson" text)
                    ON CONFLICT (id) DO NOTHING`.affectedCount().build())
            })
            eventsRead += response.data.length
            if (meta.cursor) await api.acknowledge(meta.cursor as string)
            moreEvents = meta.has_more
            if (!moreEvents) {
                await savePage(async tx => { await tx.orm.public.SmartEmailSync.where({ id: syncId }).update({ eventsSyncedAt: new Date().toISOString() }) })
                break
            }
        }
        await savePage(async tx => { await tx.orm.public.SmartEmailSync.where({ id: syncId }).update({ lastError: null }) })
        return { busy: false, more: moreContacts || moreEvents, moreContacts, moreEvents, contactsRead, eventsRead }
    } catch (error) {
        const message = error instanceof SmartEmailSyncError ? error.message : 'SmartEmailing sync failed. Check the database, migrations and service availability.'
        await db.orm.public.SmartEmailSync.where({ id: syncId, lockToken: token }).update({ lastError: message })
        throw new SmartEmailSyncError(message)
    } finally {
        await db.orm.public.SmartEmailSync.where({ id: syncId, lockToken: token }).update({ lockToken: null, lockUntil: null })
    }
}
