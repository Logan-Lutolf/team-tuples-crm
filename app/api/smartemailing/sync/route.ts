import { createHash, timingSafeEqual } from 'node:crypto'
import { smartEmailConfigured, smartEmailSettings, SmartEmailSyncError } from '@/lib/smartemailing-api'
import { syncSmartEmailing } from '@/lib/smartemailing-sync'

export const runtime = 'nodejs'
export const maxDuration = 300

// This endpoint is for an IT-managed scheduler, not browser users or public webhooks.
export async function POST(request: Request) {
    const settings = smartEmailSettings()
    if (!smartEmailConfigured(settings)) return Response.json({ error: 'SmartEmailing sync is not configured.' }, { status: 503 })
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1] ?? ''
    const hash = (value: string) => createHash('sha256').update(value).digest()
    if (!token || !timingSafeEqual(hash(token), hash(settings.secret))) return Response.json({ error: 'Unauthorized.' }, { status: 401 })
    try { return Response.json(await syncSmartEmailing(settings)) }
    catch (error) {
        return Response.json({ error: error instanceof SmartEmailSyncError ? error.message : 'SmartEmailing sync failed. Retry later.' }, { status: 502 })
    }
}
