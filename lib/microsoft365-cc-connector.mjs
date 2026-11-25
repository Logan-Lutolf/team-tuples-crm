import { createHash, timingSafeEqual } from 'node:crypto';
import { mkdir, open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validEmail } from './email-contacts.ts';

export const VERIFIED_SENDER_HEADER = 'X-CRM-Verified-Sender';
const GRAPH_ORIGIN = 'https://graph.microsoft.com';

export function microsoft365TrackingSettings(env = process.env) {
    const mailbox = env.EMAIL_TRACKING_CC_ADDRESS?.trim().toLowerCase() ?? '';
    const tenantId = env.M365_TENANT_ID?.trim() ?? '';
    const clientId = env.M365_CLIENT_ID?.trim() ?? '';
    const clientSecret = env.M365_CLIENT_SECRET ?? '';
    const webhookSecret = env.EMAIL_TRACKING_WEBHOOK_SECRET ?? '';
    const senderProof = env.M365_VERIFIED_SENDER_SECRET ?? '';
    if (!validEmail(mailbox) || mailbox.endsWith('.invalid') || mailbox.endsWith('@your-tenant.onmicrosoft.com')) throw Error('Set a real EMAIL_TRACKING_CC_ADDRESS; replace YOUR-TENANT with your actual tenant.');
    const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guid.test(tenantId) || !guid.test(clientId) || !clientSecret.trim()) {
        throw Error('Set M365_TENANT_ID, M365_CLIENT_ID and M365_CLIENT_SECRET from your Microsoft app registration.');
    }
    if (webhookSecret.length < 32 || senderProof.length < 32 || webhookSecret === senderProof) {
        throw Error('Use different random secrets of at least 32 characters for EMAIL_TRACKING_WEBHOOK_SECRET and M365_VERIFIED_SENDER_SECRET.');
    }
    let endpoint;
    try { endpoint = new URL(env.EMAIL_TRACKING_SYNC_URL); } catch { throw Error('Set EMAIL_TRACKING_SYNC_URL to the CRM /api/email-tracking endpoint.'); }
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname);
    if ((endpoint.protocol !== 'https:' && !(local && endpoint.protocol === 'http:')) ||
        endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/api/email-tracking') {
        throw Error('Use an HTTPS /api/email-tracking URL (HTTP is allowed only for localhost).');
    }
    return { mailbox, tenantId, clientId, clientSecret, webhookSecret, senderProof, endpoint: endpoint.href,
        stateDirectory: resolve(env.EMAIL_TRACKING_STATE_DIRECTORY || '.local/cc-tracking') };
}

export function mailboxStatePaths(settings) {
    // Each mailbox/tenant/CRM combination has its own cursor. Switching addresses never reuses another inbox's cursor.
    const key = createHash('sha256').update(JSON.stringify([
        settings.tenantId, settings.clientId, settings.mailbox, settings.endpoint,
    ])).digest('hex');
    return { state: resolve(settings.stateDirectory, `${key}.json`), lock: resolve(settings.stateDirectory, `${key}.lock`) };
}

function graphUrl(value) {
    let url;
    try { url = new URL(value); } catch { throw Error('Invalid Microsoft Graph continuation URL.'); }
    // Saved/provider URLs must never send the access token to another host or follow redirects.
    if (url.origin !== GRAPH_ORIGIN || !url.pathname.startsWith('/v1.0/') || url.username || url.password || url.hash) {
        throw Error('Unexpected Microsoft Graph continuation URL.');
    }
    return url.href;
}

function equalSecret(left, right) {
    const hash = value => createHash('sha256').update(value).digest();
    return timingSafeEqual(hash(left), hash(right));
}

export function trackedMetadata(message, settings, now = Date.now()) {
    if (message.isDraft) return { skipped: 'draft' };
    const proofs = (message.internetMessageHeaders ?? []).filter(h =>
        typeof h.name === 'string' && h.name.toLowerCase() === VERIFIED_SENDER_HEADER.toLowerCase());
    if (proofs.length !== 1 || typeof proofs[0].value !== 'string' || !equalSecret(proofs[0].value, settings.senderProof)) {
        return { skipped: 'unverifiedSender' };
    }
    const address = recipient => recipient?.emailAddress?.address?.trim().toLowerCase();
    const recipients = values => {
        if (!Array.isArray(values) || values.length > 500) throw Error('Invalid recipients in a verified Microsoft message.');
        const addresses = values.map(address);
        if (addresses.some(value => typeof value !== 'string' || !validEmail(value))) throw Error('Invalid address in a verified Microsoft message.');
        return addresses;
    };
    const to = recipients(message.toRecipients), cc = recipients(message.ccRecipients);
    if (!cc.includes(settings.mailbox)) return { skipped: 'notInCc' };
    const from = address(message.from);
    const messageId = message.internetMessageId?.trim();
    const sentAt = message.sentDateTime;
    if (!from || !validEmail(from) || !messageId || messageId.length > 998 || !/^[\x21-\x7e]+$/.test(messageId) ||
        typeof sentAt !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/i.test(sentAt) ||
        !Number.isFinite(Date.parse(sentAt)) || Date.parse(sentAt) > now + 300_000) {
        throw Error('Invalid metadata in a verified Microsoft message; cursor was not advanced.');
    }
    return { metadata: { senderVerified: true, messageId, from, to, cc, sentAt } };
}

async function request(url, options, service, allowNotFound = false) {
    let response;
    try { response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(20_000) }); }
    catch { throw Error(`${service} request failed or timed out. Retry this job later.`); }
    // Responses and URLs may contain tokens/contact data; expose only the service and status.
    if (allowNotFound && response.status === 404) return null;
    if (!response.ok) throw Error(`${service} returned HTTP ${response.status}. Check configuration/permissions and retry; progress is retained.`);
    try { return await response.json(); } catch { throw Error(`${service} returned invalid JSON.`); }
}

export async function syncMicrosoft365Mailbox(settings) {
    await mkdir(settings.stateDirectory, { recursive: true, mode: 0o700 });
    const paths = mailboxStatePaths(settings);
    let lock;
    try { lock = await open(paths.lock, 'wx', 0o600); }
    catch (error) {
        if (error.code === 'EEXIST') throw Error('This mailbox connector is already running or has a stale lock. See the setup guide before removing its lock file.');
        throw Error('Cannot create mailbox connector lock file. Check state directory permissions.');
    }
    try {
        await lock.writeFile(String(process.pid));
        let state = null;
        try { state = JSON.parse(await readFile(paths.state, 'utf8')); }
        catch (error) { if (error.code !== 'ENOENT') throw Error('Cannot read mailbox cursor. Inspect the state file before retrying.'); }
        const root = `${GRAPH_ORIGIN}/v1.0/users/${encodeURIComponent(settings.mailbox)}`;
        const initial = `${root}/mailFolders/inbox/messages/delta?$select=id&changeType=created`;
        let next = state ? graphUrl(state.next) : initial;
        const token = await request(`https://login.microsoftonline.com/${settings.tenantId}/oauth2/v2.0/token`, {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ client_id: settings.clientId, client_secret: settings.clientSecret,
                grant_type: 'client_credentials', scope: 'https://graph.microsoft.com/.default' }).toString(),
        }, 'Microsoft authentication');
        if (typeof token.access_token !== 'string' || !token.access_token) throw Error('Microsoft authentication returned no access token.');
        const headers = { Authorization: `Bearer ${token.access_token}`, Prefer: 'IdType="ImmutableId", odata.maxpagesize=100' };
        const result = { processed: 0, skipped: {}, more: true };
        for (let pageNumber = 0; pageNumber < 100; pageNumber++) {
            const page = await request(graphUrl(next), { headers }, 'Microsoft Graph');
            if (!Array.isArray(page.value)) throw Error('Microsoft Graph returned an invalid message page.');
            const continuation = page['@odata.nextLink'] ?? page['@odata.deltaLink'];
            if (typeof continuation !== 'string') throw Error('Microsoft Graph returned no continuation cursor.');
            graphUrl(continuation);
            for (const entry of page.value) {
                if (entry['@removed']) continue;
                if (typeof entry.id !== 'string' || !entry.id) throw Error('Microsoft Graph returned an invalid message identifier.');
                // Headers require a get-message request. Select metadata only, never bodies or attachments.
                const message = await request(`${root}/messages/${encodeURIComponent(entry.id)}?$select=internetMessageId,from,toRecipients,ccRecipients,sentDateTime,internetMessageHeaders,isDraft`, { headers }, 'Microsoft Graph', true);
                if (!message) { result.skipped.removed = (result.skipped.removed ?? 0) + 1; continue; }
                const parsed = trackedMetadata(message, settings);
                if (parsed.skipped) { result.skipped[parsed.skipped] = (result.skipped[parsed.skipped] ?? 0) + 1; continue; }
                const body = JSON.stringify(parsed.metadata);
                if (Buffer.byteLength(body) > 65536) throw Error('Verified message metadata exceeds the CRM limit. Cursor was not advanced.');
                const recorded = await request(settings.endpoint, { method: 'POST', headers: {
                    Authorization: `Bearer ${settings.webhookSecret}`, 'Content-Type': 'application/json',
                }, body }, 'CRM email tracking');
                if (typeof recorded.matchedContacts !== 'number' || typeof recorded.duplicate !== 'boolean') throw Error('CRM returned an unexpected tracking response.');
                result.processed++;
            }
            // Commit progress only after the whole page reaches the CRM. Replays use original Message-IDs.
            const temporary = `${paths.state}.${process.pid}.tmp`;
            await writeFile(temporary, JSON.stringify({ next: continuation }), { mode: 0o600 });
            await rename(temporary, paths.state);
            next = continuation;
            if (!page['@odata.nextLink']) { result.more = false; break; }
        }
        return result;
    } finally {
        await lock.close();
        await unlink(paths.lock);
    }
}
