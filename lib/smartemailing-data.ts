import 'server-only'
import { db } from '@/prisma/db'
import { smartEmailConfigured, type SmartList } from '@/lib/smartemailing-api'

export async function loadSmartEmailStatus() {
    const state = await db.orm.public.SmartEmailSync.where({ id: 'smartemailing' }).first()
    return { configured: smartEmailConfigured(), contactsSyncedAt: state?.contactsSyncedAt ?? null,
        eventsSyncedAt: state?.eventsSyncedAt ?? null, catchingUp: Boolean(state?.contactOffset || (state && !state.eventsSyncedAt)), lastError: state?.lastError ?? null }
}
export async function loadSmartEmailContact(emailAddress: string) {
    const email = emailAddress.trim().toLowerCase()
    const latest = (type: string) => db.orm.public.SmartEmailEvent.where({ email, type }).orderBy(e => e.occurredAt.desc()).first()
    const [status, profile, delivered, opened, clicked, unsubscribed, bounced, history] = await Promise.all([
        loadSmartEmailStatus(), db.orm.public.SmartEmailContact.where({ email }).orderBy(c => c.syncedAt.desc()).first(),
        latest('email.delivered'), latest('email.opened'), latest('email.clicked'), latest('email.unsubscribed'), latest('email.bounced'),
        db.orm.public.SmartEmailEvent.where({ email }).orderBy([e => e.occurredAt.desc(), e => e.id.desc()]).limit(50).all().toArray(),
    ])
    const messageEvent = (type: string) => db.orm.public.SmartEmailEvent.where({ email, messageId: delivered!.messageId, type }).select('id').first()
    const [messageOpened, messageClicked] = delivered ? await Promise.all([messageEvent('email.opened'), messageEvent('email.clicked')]) : [null, null]
    // Deleted provider contacts must not keep appearing as current list members.
    const profileIsCurrent = Boolean(profile && status.contactsSyncedAt && Date.parse(profile.syncedAt) >= Date.parse(status.contactsSyncedAt))
    const lists: SmartList[] = profileIsCurrent ? JSON.parse(profile!.listsJson) : []
    return { status, profile: profileIsCurrent ? { lists, hardBounced: profile!.hardBounced, softBounces: profile!.softBounces, blacklisted: profile!.blacklisted } : null,
        delivered, opened, clicked, unsubscribed, bounced, history,
        latestMessageOpened: Boolean(messageOpened),
        latestMessageClicked: Boolean(messageClicked) }
}
export type SmartEmailContactDetails = Awaited<ReturnType<typeof loadSmartEmailContact>>
