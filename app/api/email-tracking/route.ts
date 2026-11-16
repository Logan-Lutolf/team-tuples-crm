import { createHash, timingSafeEqual } from 'node:crypto'
import { db } from '@/prisma/db'
import { emailTrackingSettings, recordTrackedEmail } from '@/lib/email-tracking'
import { EmailTrackingError, validateTrackedEmail } from '@/lib/email-tracking-input'

export const runtime = 'nodejs'

async function readMetadata(request: Request) {
    // Bound the request body even when Content-Length is absent or incorrect.
    const reader = request.body?.getReader()
    if (!reader) throw new EmailTrackingError('Request body is required.')
    const chunks: Uint8Array[] = []
    let size = 0
    try {
        while (true) {
            const { value, done } = await reader.read()
            if (done) break
            size += value.byteLength
            if (size > 65536) { await reader.cancel(); throw new EmailTrackingError('Request body exceeds 64 KB.', 413) }
            chunks.push(value)
        }
    } finally { reader.releaseLock() }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown }
    catch { throw new EmailTrackingError('Invalid JSON metadata.') }
}

export async function POST(request: Request) {
    const settings = emailTrackingSettings()
    if (!settings.configured) return Response.json({ error: 'Email tracking is not configured.' }, { status: 503 })
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1] ?? ''
    const hash = (value: string) => createHash('sha256').update(value).digest()
    if (!token || !timingSafeEqual(hash(token), hash(settings.secret))) return Response.json({ error: 'Unauthorized.' }, { status: 401 })
    try {
        const email = validateTrackedEmail(await readMetadata(request), settings.mailbox)
        try {
            return Response.json(await db.transaction(tx => recordTrackedEmail(tx, email, settings.allowedSenders)))
        } catch (error) {
            if (error && typeof error === 'object' && 'sqlState' in error && error.sqlState === '23505') {
                const existing = await db.orm.public.TrackedEmail.where({ id: email.messageId }).first()
                if (existing?.fingerprint === email.fingerprint) return Response.json({ matchedContacts: existing.matchedContactCount, duplicate: true })
                if (existing) throw new EmailTrackingError('This Message-ID was already recorded with different metadata.', 409)
            }
            throw error
        }
    } catch (error) {
        if (error instanceof EmailTrackingError) return Response.json({ error: error.message }, { status: error.status })
        return Response.json({ error: 'Could not record this email. Retry the same Message-ID later.' }, { status: 500 })
    }
}
