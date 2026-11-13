// Real disposable Postgres + mocked provider: no SmartEmailing account or outbound email.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { userInfo } from 'node:os';
import pg from 'pg';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson from '../../prisma/contract.json' with { type: 'json' };
import { emptyContactFilters, filterEmailContacts, lastEmailAt } from '../../lib/email-contacts.ts';

const port = Number(process.env.MIGRATION_TEST_PORT);
if (!Number.isSafeInteger(port) || port <= 0) throw new Error('Set MIGRATION_TEST_PORT to a disposable local Postgres port.');
registerHooks({ resolve(specifier, context, next) {
    if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true };
    if (specifier === '@/prisma/db') return { url: 'data:text/javascript,export const db=globalThis.smartEmailTestDb', shortCircuit: true };
    if (specifier === '@/lib/current-employee') return { url: 'data:text/javascript,export async function currentEmployee(){return null}', shortCircuit: true };
    if (specifier.startsWith('@/lib/')) return next(new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return next(specifier, context);
} });

test('read-only SmartEmailing import is replay-safe, resumable and separate from CC tracking', async t => {
    const config = { host: '127.0.0.1', port, user: userInfo().username };
    const database = `smartemailing_test_${randomBytes(8).toString('hex')}`;
    const admin = new pg.Client({ ...config, database: 'postgres' }); await admin.connect();
    let runtime, client;
    const originalFetch = globalThis.fetch;
    const envKeys = ['SMARTEMAILING_USERNAME', 'SMARTEMAILING_API_KEY', 'SMARTEMAILING_EVENT_STREAM_ID', 'SMARTEMAILING_SYNC_SECRET'];
    const previousEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
    try {
        await admin.query(`CREATE DATABASE "${database}"`);
        const url = `postgresql://${encodeURIComponent(config.user)}@127.0.0.1:${port}/${database}`;
        const migration = spawnSync(process.execPath, ['node_modules/prisma/dist/prisma.js', 'db', 'migrate'], { encoding: 'utf8', timeout: 30000, env: { ...process.env, DATABASE_URL: url, DO_NOT_TRACK: '1' } });
        assert.equal(migration.status, 0, `${migration.stdout}\n${migration.stderr}`);
        runtime = postgres({ contractJson, url }); globalThis.smartEmailTestDb = runtime;
        client = new pg.Client({ ...config, database }); await client.connect();
        await client.query(`INSERT INTO public."Contact"(id,name,email,"contactRole","updatedAt") VALUES (1,'Teacher','Teacher@example.test','TEACHER',now())`);
        const { POST } = await import('../../app/api/smartemailing/sync/route.ts');
        const { loadSmartEmailContact } = await import('../../lib/smartemailing-data.ts');
        const { loadEmailContacts } = await import('../../lib/email-contacts-server.ts');
        const { normalizeSmartEvent } = await import('../../lib/smartemailing-api.ts');
        Object.assign(process.env, { SMARTEMAILING_USERNAME: 'api@example.test', SMARTEMAILING_API_KEY: 'fake-test-key', SMARTEMAILING_EVENT_STREAM_ID: 'test-stream', SMARTEMAILING_SYNC_SECRET: 'test-secret-'.repeat(4) });
        const request = token => new Request('http://localhost/api/smartemailing/sync', { method: 'POST', headers: { Authorization: `Bearer ${token ?? process.env.SMARTEMAILING_SYNC_SECRET}` } });
        const json = data => Response.json(data);
        const event = (id, type, time, messageId = 'newsletter-1', extras = {}) => ({ specversion: '1.0', id, source: '/accounts/1', type: `email.${type}`, time,
            data: { email_message_id: messageId, contact: { id: 10, emailaddress: 'teacher@example.test' }, email_statistic: { type: 'automation', name: 'Monthly newsletter', template: { subject: 'School news' } }, details: extras } });
        let events = [event('open', 'opened', '2026-11-12T11:00:00Z'), event('delivery', 'delivered', '2026-11-12T10:00:00Z'),
            event('click', 'clicked', '2026-11-12T11:05:00Z'), event('unsubscribe', 'unsubscribed', '2026-11-12T12:00:00Z'),
            event('bounce', 'bounced', '2026-11-13T10:00:00Z', 'newsletter-2', { bounce_type: 'hard', reason: 'email_does_not_exist' })];
        let contacts = [{ id: 10, emailaddress: 'TEACHER@example.test', hardbounced: 1, softbounced: 0, blacklisted: 0,
            contactlists: [{ contactlist_id: 7, status: 'unsubscribed' }, { contactlist_id: 8, status: 'confirmed' }] }];
        let acknowledgeFailure = false, apiFailure = false, malformed = false, pagination = false;
        let acknowledgements = 0, calls = [];
        globalThis.fetch = async (input, init) => {
            const apiUrl = new URL(input); calls.push({ path: apiUrl.pathname, method: init.method });
            assert.equal(apiUrl.origin, 'https://app.smartemailing.cz');
            assert.equal(init.headers.Authorization, `Basic ${Buffer.from('api@example.test:fake-test-key').toString('base64')}`);
            if (apiFailure) return new Response('private provider details', { status: 429 });
            if (apiUrl.pathname.endsWith('/ack')) {
                assert.equal(init.method, 'POST'); assert.equal(JSON.parse(init.body).cursor, 'cursor-1');
                acknowledgements++;
                if (acknowledgeFailure) return new Response('private failure', { status: 500 });
                return new Response(null, { status: 204 });
            }
            assert.equal(init.method, 'GET');
            if (apiUrl.pathname.endsWith('/contactlists')) return json({ status: 'ok', meta: { total_count: 2 }, data: [{ id: 7, name: 'PNS Teachers' }, { id: 8, name: 'PNS Parents' }] });
            if (apiUrl.pathname.endsWith('/contacts')) {
                const offset = Number(apiUrl.searchParams.get('offset'));
                const data = pagination ? offset < 7 ? [{ ...contacts[0], id: 100 + offset, emailaddress: `page-${offset}@example.test` }] : [] : contacts;
                return json({ status: 'ok', meta: { total_count: pagination ? 7 : contacts.length }, data });
            }
            assert.equal(apiUrl.pathname, '/api/v3/event-streams/test-stream');
            return json({ status: 'ok', meta: { cursor: 'cursor-1', has_more: false }, data: malformed ? [...events, { type: 'email.clicked', data: null }] : events });
        };
        await t.test('scheduler authentication and missing configuration reject requests before any API call', async () => {
            assert.equal((await POST(request('wrong'))).status, 401);
            const key = process.env.SMARTEMAILING_API_KEY; delete process.env.SMARTEMAILING_API_KEY;
            assert.equal((await POST(request())).status, 503); process.env.SMARTEMAILING_API_KEY = key;
            assert.equal(calls.length, 0);
        });
        await t.test('imports provider lists and all requested activity, without changing staff interaction dates', async () => {
            const response = await POST(request()); assert.equal(response.status, 200); assert.equal((await response.json()).more, false);
            const details = await loadSmartEmailContact('Teacher@example.test');
            assert.equal(details.delivered.campaignName, 'Monthly newsletter'); assert.equal(details.latestMessageOpened, true); assert.equal(details.latestMessageClicked, true);
            assert.ok(details.unsubscribed); assert.equal(details.profile.lists[0].status, 'unsubscribed'); assert.equal(details.profile.lists[1].name, 'PNS Parents');
            assert.equal(details.profile.hardBounced, true); assert.match(details.bounced.detailsJson, /email_does_not_exist/);
            const [contact] = await loadEmailContacts(); assert.equal(contact.lastTrackedEmailAt, null); assert.equal(lastEmailAt(contact), details.delivered.occurredAt);
            assert.equal(filterEmailContacts([contact], { ...emptyContactFilters, lastEmail: 'contacted' }).length, 1);
            assert.equal(filterEmailContacts([contact], { ...emptyContactFilters, lastEmail: 'never' }).length, 0);
            assert.equal((await client.query('SELECT * FROM public."Interaction"')).rowCount, 0);
            assert.equal((await runtime.orm.public.Contact.where({ id: 1 }).first()).last_contacted_byId, null);
            assert.equal(calls.filter(call => call.method === 'POST').every(call => call.path.endsWith('/ack')), true);
        });
        await t.test('ACK failures leave committed events replayable; retries do not duplicate events', async () => {
            events.push(event('new-open', 'opened', '2026-11-13T12:00:00Z'));
            acknowledgeFailure = true;
            assert.equal((await POST(request())).status, 502);
            assert.equal((await client.query('SELECT * FROM public."SmartEmailEvent"')).rowCount, 6);
            assert.ok((await loadSmartEmailContact('teacher@example.test')).status.lastError);
            acknowledgeFailure = false;
            assert.equal((await POST(request())).status, 200);
            assert.equal((await client.query('SELECT * FROM public."SmartEmailEvent"')).rowCount, 6);
            assert.equal((await loadSmartEmailContact('teacher@example.test')).status.lastError, null);
        });
        await t.test('malformed batches are not acknowledged; API failures preserve imported history', async () => {
            const ackCount = acknowledgements; malformed = true;
            assert.equal((await POST(request())).status, 502); assert.equal(acknowledgements, ackCount); malformed = false;
            apiFailure = true;
            const response = await POST(request()); assert.equal(response.status, 502);
            assert.doesNotMatch(JSON.stringify(await response.json()), /private provider|fake-test-key/); apiFailure = false;
            assert.equal((await loadSmartEmailContact('teacher@example.test')).history.length, 6);
            assert.equal(normalizeSmartEvent({ type: 'email.future_event' }), null);
            assert.equal(normalizeSmartEvent({ ...event('forgotten', 'opened', '2026-11-13T12:00:00Z'), data: { ...events[0].data, contact: { id: 10, emailaddress: null } } }), null);
        });
        await t.test('overlapping workers skip safely and changed streams are refused', async () => {
            const before = calls.length;
            await client.query(`UPDATE public."SmartEmailSync" SET "lockToken"='other-worker', "lockUntil"=now()+interval '10 minutes'`);
            assert.equal((await (await POST(request())).json()).busy, true); assert.equal(calls.length, before);
            await client.query('UPDATE public."SmartEmailSync" SET "lockToken"=NULL, "lockUntil"=NULL');
            process.env.SMARTEMAILING_EVENT_STREAM_ID = 'different-stream';
            assert.equal((await POST(request())).status, 502); assert.equal(calls.length, before);
            process.env.SMARTEMAILING_EVENT_STREAM_ID = 'test-stream';
        });
        await t.test('large contact imports resume from their stored page and removed profiles stop showing current memberships', async () => {
            pagination = true;
            await client.query('UPDATE public."SmartEmailSync" SET "contactsSyncedAt"=NULL');
            let result = await (await POST(request())).json(); assert.equal(result.moreContacts, true); assert.equal(result.contactsRead, 5);
            assert.equal((await runtime.orm.public.SmartEmailSync.where({ id: 'smartemailing' }).first()).contactOffset, 5);
            result = await (await POST(request())).json(); assert.equal(result.moreContacts, false); assert.equal(result.contactsRead, 2);
            const details = await loadSmartEmailContact('teacher@example.test'); assert.equal(details.profile, null); assert.equal(details.history.length, 6);
            await client.query('UPDATE public."Contact" SET email=\'replacement@example.test\' WHERE id=1');
            assert.equal(lastEmailAt((await loadEmailContacts())[0]), null);
        });
    } finally {
        globalThis.fetch = originalFetch;
        for (const key of envKeys) { if (previousEnv[key] === undefined) delete process.env[key]; else process.env[key] = previousEnv[key]; }
        if (runtime) await runtime.close(); if (client) await client.end();
        await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`); await admin.end();
    }
});
