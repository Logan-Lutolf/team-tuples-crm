// Run daily from the hosting scheduler. This calls the CRM; it never sends email.
const url = process.env.SMARTEMAILING_SYNC_URL;
const secret = process.env.SMARTEMAILING_SYNC_SECRET;
if (!url || !secret || secret.length < 32) throw new Error('Set SMARTEMAILING_SYNC_URL and SMARTEMAILING_SYNC_SECRET.');
const endpoint = new URL(url);
if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(endpoint.hostname))) {
    throw new Error('Use HTTPS for the sync URL (HTTP is allowed only for localhost tests).');
}
let completed = false;
try {
    for (let attempt = 0; attempt < 100; attempt++) {
        const response = await fetch(endpoint, {
            method: 'POST', redirect: 'error', headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(330_000),
        });
        if (!response.ok) throw new Error(`CRM sync returned HTTP ${response.status}. Check the server configuration and sync status.`);
        const result = await response.json();
        if (result.busy) throw new Error('Another sync is running. Retry this scheduled job later.');
        if (typeof result.more !== 'boolean') throw new Error('Unexpected sync response.');
        console.log(`Imported ${result.contactsRead} contacts and read ${result.eventsRead} events.`);
        if (!result.more) { completed = true; break; }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!completed) throw new Error('Sync is still catching up after 100 requests. Schedule another run and check progress.');
} catch (error) {
    // Never dump request headers or credentials into scheduler logs.
    console.error(error instanceof Error && !error.message.includes(secret) ? error.message : 'Sync failed. Check the CRM sync status.');
    process.exitCode = 1;
}
