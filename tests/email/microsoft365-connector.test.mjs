import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { microsoft365TrackingSettings, mailboxStatePaths, trackedMetadata, syncMicrosoft365Mailbox,
    VERIFIED_SENDER_HEADER } from '../../lib/microsoft365-cc-connector.mjs';

const env = {
    EMAIL_TRACKING_CC_ADDRESS: 'tracking@test.example', EMAIL_TRACKING_WEBHOOK_SECRET: 'webhook-test-secret-'.repeat(3),
    EMAIL_TRACKING_SYNC_URL: 'http://localhost:3000/api/email-tracking',
    M365_TENANT_ID: '11111111-1111-1111-1111-111111111111',
    M365_CLIENT_ID: '22222222-2222-2222-2222-222222222222', M365_CLIENT_SECRET: 'test-client-secret',
    M365_VERIFIED_SENDER_SECRET: 'transport-test-secret-'.repeat(3),
};
const address = value => ({ emailAddress: { address: value } });
function message(settings) {
    return { isDraft: false, internetMessageId: '<original-message@example.test>',
        from: address('Employee@example.test'), toRecipients: [address('person@example.test')],
        ccRecipients: [address(settings.mailbox)], sentDateTime: '2026-01-10T10:00:00Z',
        internetMessageHeaders: [{ name: VERIFIED_SENDER_HEADER, value: settings.senderProof }] };
}

test('one configured CC address drives mailbox selection; account/endpoint changes isolate cursors', () => {
    const first = microsoft365TrackingSettings(env);
    const second = microsoft365TrackingSettings({ ...env, EMAIL_TRACKING_CC_ADDRESS: ' CRM-Tracking@Postbellum.cz ' });
    assert.equal(second.mailbox, 'crm-tracking@postbellum.cz');
    assert.notEqual(mailboxStatePaths(first).state, mailboxStatePaths(second).state);
    assert.notEqual(mailboxStatePaths(first).state, mailboxStatePaths({ ...first, tenantId: env.M365_CLIENT_ID }).state);
    assert.notEqual(mailboxStatePaths(first).state, mailboxStatePaths({ ...first, endpoint: 'https://crm.example/api/email-tracking' }).state);
    assert.throws(() => microsoft365TrackingSettings({ ...env, EMAIL_TRACKING_SYNC_URL: 'http://remote.example/api/email-tracking' }));
    assert.throws(() => microsoft365TrackingSettings({ ...env, M365_VERIFIED_SENDER_SECRET: env.EMAIL_TRACKING_WEBHOOK_SECRET }));
    assert.throws(() => microsoft365TrackingSettings({ ...env, M365_TENANT_ID: '../other' }));
    assert.throws(() => microsoft365TrackingSettings({ ...env, EMAIL_TRACKING_CC_ADDRESS: 'pb-tracker@YOUR-TENANT.onmicrosoft.com' }), /replace YOUR-TENANT/);
});

test('metadata requires the trusted transport marker and the configured mailbox in CC', () => {
    const settings = microsoft365TrackingSettings(env), email = message(settings);
    const valid = trackedMetadata(email, settings).metadata;
    assert.equal(valid.messageId, email.internetMessageId);
    assert.equal(valid.from, 'employee@example.test');
    assert.equal(valid.senderVerified, true);
    assert.equal(trackedMetadata({ ...email, internetMessageHeaders: [] }, settings).skipped, 'unverifiedSender');
    assert.equal(trackedMetadata({ ...email, internetMessageHeaders: [{ name: VERIFIED_SENDER_HEADER, value: 'forged' }] }, settings).skipped, 'unverifiedSender');
    assert.equal(trackedMetadata({ ...email, internetMessageHeaders: [...email.internetMessageHeaders, ...email.internetMessageHeaders] }, settings).skipped, 'unverifiedSender');
    assert.equal(trackedMetadata({ ...email, ccRecipients: [address('old@example.test')] }, settings).skipped, 'notInCc');
    assert.equal(trackedMetadata({ ...email, isDraft: true }, settings).skipped, 'draft');
    assert.throws(() => trackedMetadata({ ...email, sentDateTime: '2099-01-01T00:00:00Z' }, settings));
    assert.throws(() => trackedMetadata({ ...email, internetMessageId: 'bad\r\nmessage' }, settings));
    assert.throws(() => trackedMetadata({ ...email, toRecipients: [address('invalid')] }, settings));
    assert.equal(Object.hasOwn(valid, 'body'), false);
    assert.equal(Object.hasOwn(valid, 'attachments'), false);
});

test('failed CRM delivery does not advance the page; a retry replays the original Message-ID', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'crm-cc-'));
    const settings = microsoft365TrackingSettings({ ...env, EMAIL_TRACKING_STATE_DIRECTORY: directory });
    const original = globalThis.fetch;
    const cursor = 'https://graph.microsoft.com/v1.0/users/test/mailFolders/inbox/messages/delta?$deltatoken=cursor';
    let crmFails = true, delivered = [], deltaRequests = [];
    globalThis.fetch = async (url, options) => {
        const parsed = new URL(url);
        if (parsed.hostname === 'login.microsoftonline.com') return Response.json({ access_token: 'test-access-token' });
        if (parsed.hostname === 'graph.microsoft.com') {
            assert.equal(options.headers.Authorization, 'Bearer test-access-token');
            if (parsed.pathname.endsWith('/messages/delta')) {
                deltaRequests.push(String(url));
                return Response.json({ value: [{ id: 'message-1' }], '@odata.deltaLink': cursor });
            }
            assert.ok(parsed.search.includes('internetMessageHeaders'));
            assert.ok(!parsed.search.includes('body'));
            return Response.json(message(settings));
        }
        assert.equal(String(url), settings.endpoint);
        assert.equal(options.headers.Authorization, `Bearer ${settings.webhookSecret}`);
        delivered.push(JSON.parse(options.body));
        if (crmFails) return new Response('private provider text', { status: 503 });
        return Response.json({ duplicate: delivered.length > 1, matchedContacts: 1 });
    };
    try {
        await assert.rejects(syncMicrosoft365Mailbox(settings), /CRM email tracking returned HTTP 503/);
        await assert.rejects(readFile(mailboxStatePaths(settings).state), { code: 'ENOENT' });
        crmFails = false;
        assert.equal((await syncMicrosoft365Mailbox(settings)).processed, 1);
        assert.equal(delivered[0].messageId, delivered[1].messageId);
        assert.equal(deltaRequests[0], deltaRequests[1]);
        assert.equal(JSON.parse(await readFile(mailboxStatePaths(settings).state)).next, cursor);
        await syncMicrosoft365Mailbox(settings);
        assert.equal(deltaRequests[2], cursor);
        const switched = { ...settings, mailbox: 'new-mailbox@example.test' };
        await syncMicrosoft365Mailbox(switched);
        assert.ok(deltaRequests[3].includes(encodeURIComponent(switched.mailbox)));
        assert.ok(!deltaRequests[3].includes('$deltatoken'));
    } finally { globalThis.fetch = original; await rm(directory, { recursive: true, force: true }); }
});

test('unverified messages are skipped; hostile continuation URLs and concurrent workers are rejected', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'crm-cc-'));
    const settings = microsoft365TrackingSettings({ ...env, EMAIL_TRACKING_STATE_DIRECTORY: directory });
    const original = globalThis.fetch;
    let hostile = false, crmCalls = 0;
    const cursor = 'https://graph.microsoft.com/v1.0/users/test/messages/delta?$deltatoken=safe';
    globalThis.fetch = async url => {
        const parsed = new URL(url);
        if (parsed.hostname === 'login.microsoftonline.com') return Response.json({ access_token: 'test-token' });
        assert.equal(parsed.hostname, 'graph.microsoft.com');
        if (parsed.pathname.endsWith('/messages/delta')) return Response.json({ value: [{ id: 'spam' }],
            '@odata.deltaLink': hostile ? 'https://attacker.example/steal-token' : cursor });
        if (parsed.pathname.endsWith('/messages/spam')) return Response.json({ ...message(settings), internetMessageHeaders: [] });
        crmCalls++; throw Error('Unexpected CRM call');
    };
    try {
        const result = await syncMicrosoft365Mailbox(settings);
        assert.equal(result.skipped.unverifiedSender, 1); assert.equal(crmCalls, 0);
        hostile = true;
        await assert.rejects(syncMicrosoft365Mailbox(settings), /Unexpected Microsoft Graph/);
        assert.equal(JSON.parse(await readFile(mailboxStatePaths(settings).state)).next, cursor);
        await writeFile(mailboxStatePaths(settings).lock, 'test-other-worker');
        await assert.rejects(syncMicrosoft365Mailbox(settings), /already running/);
        await rm(mailboxStatePaths(settings).lock);
        await writeFile(mailboxStatePaths(settings).state, JSON.stringify({ next: 'https://attacker.example/saved' }));
        await assert.rejects(syncMicrosoft365Mailbox(settings), /Unexpected Microsoft Graph/);
    } finally { globalThis.fetch = original; await rm(directory, { recursive: true, force: true }); }
});
