import { createHash } from 'node:crypto'
import { validEmail } from './email-contacts'

export class EmailTrackingError extends Error {
    status: number
    constructor(message: string, status = 400) { super(message); this.status = status }
}
export type TrackedEmailInput = { messageId: string; from: string; recipients: string[]; contactedAt: string; fingerprint: string }

export function validateTrackedEmail(raw: unknown, trackingMailbox: string, now = Date.now()): TrackedEmailInput {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new EmailTrackingError('Expected an email metadata object.')
    const value = raw as Record<string, unknown>
    // The trusted mailbox relay must verify the original sender, not merely trust From headers.
    if (value.senderVerified !== true) throw new EmailTrackingError('The relay must verify the original sender.', 403)
    if (typeof value.messageId !== 'string' || !value.messageId.trim() || value.messageId.length > 998 || !/^[\x21-\x7e]+$/.test(value.messageId.trim())) throw new EmailTrackingError('A valid original Message-ID is required.')
    if (typeof value.from !== 'string' || !validEmail(value.from)) throw new EmailTrackingError('A valid sender address is required.')
    const addresses = (key: 'to' | 'cc') => {
        const list = value[key]
        if (!Array.isArray(list) || list.length > 500 || list.some(email => typeof email !== 'string' || !validEmail(email))) throw new EmailTrackingError(`Provide at most 500 valid ${key} addresses.`)
        return (list as string[]).map(email => email.trim().toLowerCase())
    }
    const to = addresses('to'), cc = addresses('cc')
    const mailbox = trackingMailbox.toLowerCase()
    if (!cc.includes(mailbox)) throw new EmailTrackingError('The tracking mailbox must be included in CC.')
    if (typeof value.sentAt !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/i.test(value.sentAt) || !Number.isFinite(Date.parse(value.sentAt)) || Date.parse(value.sentAt) > now + 5 * 60 * 1000) throw new EmailTrackingError('Provide a valid original sentAt timestamp with a timezone, not a future date.')
    const from = value.from.trim().toLowerCase()
    const recipients = [...new Set([...to, ...cc])].filter(email => email !== mailbox && email !== from).sort()
    const contactedAt = new Date(value.sentAt).toISOString()
    return { messageId: value.messageId.trim(), from, recipients, contactedAt,
        fingerprint: createHash('sha256').update(JSON.stringify([from, recipients, contactedAt])).digest('hex') }
}
