// Only these read endpoints and the event acknowledgement are used. No send API exists here.
import 'server-only'
import { validEmail } from '@/lib/email-contacts'

export type SmartEmailSettings = { username: string; apiKey: string; streamId: string; secret: string }
export function smartEmailSettings(): SmartEmailSettings {
    return {
        username: process.env.SMARTEMAILING_USERNAME?.trim() ?? '',
        apiKey: process.env.SMARTEMAILING_API_KEY?.trim() ?? '',
        streamId: process.env.SMARTEMAILING_EVENT_STREAM_ID?.trim() ?? '',
        secret: process.env.SMARTEMAILING_SYNC_SECRET?.trim() ?? '',
    }
}
export function smartEmailConfigured(settings = smartEmailSettings()) {
    return Boolean(settings.username && settings.apiKey && /^[a-zA-Z0-9_-]{1,200}$/.test(settings.streamId) && settings.secret.length >= 32)
}
export class SmartEmailSyncError extends Error {}
export function object(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new SmartEmailSyncError('Unexpected SmartEmailing response shape.')
    return value as Record<string, unknown>
}
function text(value: unknown, max = 1000) { return typeof value === 'string' ? value.slice(0, max) : '' }
function integer(value: unknown) {
    if (!Number.isSafeInteger(value) || (value as number) < 0) throw new SmartEmailSyncError('Invalid SmartEmailing identifier or count.')
    return value as number
}

export function createSmartEmailClient(settings: SmartEmailSettings) {
    let nextRequestAt = 0
    async function request(path: string, cursor?: string): Promise<unknown> {
        // Stay below the documented four requests/second, including acknowledgements.
        await new Promise(resolve => setTimeout(resolve, Math.max(0, nextRequestAt - Date.now())))
        nextRequestAt = Date.now() + 300
        let response: Response
        try {
            response = await fetch(`https://app.smartemailing.cz/api/v3${path}`, {
                method: cursor === undefined ? 'GET' : 'POST', redirect: 'error', cache: 'no-store',
                headers: { Authorization: `Basic ${Buffer.from(`${settings.username}:${settings.apiKey}`).toString('base64')}`, 'Content-Type': 'application/json' },
                ...(cursor === undefined ? {} : { body: JSON.stringify({ cursor }) }),
                signal: AbortSignal.timeout(20_000),
            })
        } catch { throw new SmartEmailSyncError('SmartEmailing request timed out or could not connect. Retry the sync later.') }
        // Provider error bodies can contain contact data; never expose or log them.
        if (!response.ok) throw new SmartEmailSyncError(`SmartEmailing returned HTTP ${response.status}. Check credentials, API access and account limits; retry later.`)
        if (cursor !== undefined && response.status === 204) return null
        try { return await response.json() } catch { throw new SmartEmailSyncError('SmartEmailing returned invalid JSON.') }
    }
    async function page(path: string, offset: number) {
        const response = object(await request(`${path}${path.includes('?') ? '&' : '?'}limit=500&offset=${offset}&sort=id`))
        if (response.status !== 'ok' || !Array.isArray(response.data)) throw new SmartEmailSyncError('Invalid SmartEmailing page.')
        const total = integer(object(response.meta).total_count)
        if (!response.data.length && offset < total) throw new SmartEmailSyncError('SmartEmailing pagination stopped before the final page.')
        return { rows: response.data as unknown[], more: offset + response.data.length < total }
    }
    const streamPath = `/event-streams/${encodeURIComponent(settings.streamId)}`
    return {
        lists: (offset: number) => page('/contactlists?select=id,name', offset),
        contacts: (offset: number) => page('/contacts?select=id,emailaddress,contactlists,hardbounced,softbounced,blacklisted', offset),
        events: () => request(`${streamPath}?limit=1000`),
        acknowledge: (cursor: string) => request(`${streamPath}/ack`, cursor),
    }
}

export type SmartList = { id: number; name: string; status: 'confirmed' | 'unsubscribed' }
export function normalizeSmartContact(raw: unknown, lists: Map<number, string>, syncedAt: string) {
    const row = object(raw), email = text(row.emailaddress, 254).trim().toLowerCase()
    if (!validEmail(email) || !Array.isArray(row.contactlists)) throw new SmartEmailSyncError('Invalid SmartEmailing contact or list memberships.')
    const memberships: SmartList[] = row.contactlists.map(value => {
        const membership = object(value), id = integer(membership.contactlist_id)
        if (membership.status !== 'confirmed' && membership.status !== 'unsubscribed') throw new SmartEmailSyncError('Unknown SmartEmailing list membership status.')
        return { id, name: lists.get(id) ?? `List ${id}`, status: membership.status }
    })
    return { id: integer(row.id), email, listsJson: JSON.stringify(memberships), hardBounced: integer(row.hardbounced) > 0,
        softBounces: integer(row.softbounced), blacklisted: integer(row.blacklisted) > 0, syncedAt }
}

export const trackedSmartEventTypes = ['email.delivered', 'email.opened', 'email.clicked', 'email.unsubscribed', 'email.bounced', 'email.spam_complained'] as const
export function normalizeSmartEvent(raw: unknown) {
    const event = object(raw)
    // New event kinds must not block the queue. Only store the metadata the CRM displays.
    if (!trackedSmartEventTypes.includes(event.type as typeof trackedSmartEventTypes[number])) return null
    const data = object(event.data), contact = object(data.contact), statistic = data.email_statistic ? object(data.email_statistic) : {}
    const template = statistic.template ? object(statistic.template) : {}, details = data.details ? object(data.details) : {}
    const email = text(contact.emailaddress, 254).trim().toLowerCase()
    const occurredAt = text(event.time), eventId = text(event.id, 250), source = text(event.source, 250), messageId = text(data.email_message_id, 250)
    if (!eventId || !source || !messageId || !/T.*(?:Z|[+-]\d\d:\d\d)$/.test(occurredAt) || !Number.isFinite(Date.parse(occurredAt))) throw new SmartEmailSyncError('Invalid SmartEmailing event metadata.')
    // A forgotten contact can have no email address; do not re-identify it from old snapshots.
    if (!email) return null
    if (!validEmail(email)) throw new SmartEmailSyncError('Invalid email in a SmartEmailing event.')
    return { id: `${source}/${eventId}`, email, messageId, type: String(event.type), occurredAt: new Date(occurredAt).toISOString(),
        campaignName: text(statistic.name) || text(template.subject) || 'Unnamed email', subject: text(template.subject), campaignType: text(statistic.type, 100),
        detailsJson: JSON.stringify({ deviceType: text(details.device_type, 100), bounceType: text(details.bounce_type, 100), reason: text(details.reason, 200) }) }
}
