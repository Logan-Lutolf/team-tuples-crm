// Real disposable Postgres; provider responses and logged-in users are controlled by this test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { userInfo } from 'node:os';
import pg from 'pg';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson from '../../prisma/contract.json' with { type: 'json' };

const port = Number(process.env.MIGRATION_TEST_PORT);
if (!Number.isSafeInteger(port) || port <= 0) throw new Error('Set MIGRATION_TEST_PORT to a disposable localhost Postgres port.');
registerHooks({ resolve(specifier, context, next) {
    if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true };
    if (specifier === '@/prisma/db') return { url: 'data:text/javascript,export const db=globalThis.featureTestDb', shortCircuit: true };
    if (specifier === '@/lib/current-employee') return { url: 'data:text/javascript,export async function currentEmployee(){return globalThis.featureTestEmployee}', shortCircuit: true };
    if (specifier === 'next/cache') return { url: 'data:text/javascript,export function revalidatePath(){}', shortCircuit: true };
    if (specifier === 'next/headers') return { url: 'data:text/javascript,export async function cookies(){return {get(){return {value:"test-session"}}}}', shortCircuit: true };
    if (specifier === '@/app/login/sessions') return { url: 'data:text/javascript,export async function decrypt(){return globalThis.featureTestSession}', shortCircuit: true };
    if (specifier.startsWith('@/lib/')) return next(new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    if (specifier === './email-contacts') return next(new URL('../../lib/email-contacts.ts', import.meta.url).href, context);
    return next(specifier, context);
} });

test('email and recommendations use the Person/Organization contract', async t => {
    const config = { host: '127.0.0.1', port, user: userInfo().username };
    const database = `crm_features_${randomBytes(6).toString('hex')}`;
    const admin = new pg.Client({ ...config, database: 'postgres' });
    await admin.connect();
    let client, runtime;
    const originalFetch = globalThis.fetch;
    try {
        await admin.query(`CREATE DATABASE "${database}"`);
        const url = `postgresql://${encodeURIComponent(config.user)}@127.0.0.1:${port}/${database}`;
        const init = spawnSync(process.execPath, ['node_modules/prisma/dist/prisma.js', 'db', 'init'], {
            encoding: 'utf8', timeout: 60000, env: { ...process.env, DATABASE_URL: url },
        });
        assert.equal(init.status, 0, init.stdout + init.stderr);
        runtime = postgres({ contractJson, url });
        await runtime.connect();
        globalThis.featureTestDb = runtime;
        client = new pg.Client({ ...config, database }); await client.connect();
        await client.query(`
            INSERT INTO public."Branch" (id,name,region) VALUES (1,'PRAHA','PRAHA');
            INSERT INTO public."Organization" (id,name,type,region,"updatedAt") VALUES
                (1,'School','PRIMARY_SCHOOL','PRAHA',now()), (2,'Theatre','THEATRE',NULL,now()),
                (3,'Never contacted','PRIMARY_SCHOOL',NULL,now());
            INSERT INTO public."Person" (id,name,email,dob,"orgId","branchName","updatedAt") VALUES
                (1,'Admin','admin@example.test',NULL,NULL,NULL,now()),
                (2,'Teacher','teacher@example.test',NULL,1,'PRAHA',now()),
                (3,'Student',NULL,NULL,1,NULL,now()),
                (4,'Theatre contact','theatre@example.test',NULL,2,NULL,now()),
                (5,'Other admin','other-admin@example.test',NULL,NULL,NULL,now());
            INSERT INTO public."Employee" ("personId",password,"pfpImgUrl",role) VALUES
                (1,'test-only','',ARRAY['ADMIN']), (5,'test-only','',ARRAY['ADMIN']);
            INSERT INTO public."PersonRoles" ("personId",type) VALUES (2,'TEACHER'),(3,'STUDENT');
        `);
        globalThis.featureTestEmployee = { id: 1, roles: ['ADMIN'] };
        const { loadEmailContacts } = await import('../../lib/email-contacts-server.ts');
        const actions = await import('../../app/email/actions.ts');
        const { POST: track } = await import('../../app/api/email-tracking/route.ts');
        const { POST: sync } = await import('../../app/api/smartemailing/sync/route.ts');
        const { loadSmartEmailContact } = await import('../../lib/smartemailing-data.ts');
        const { loadRecommendations } = await import('../../app/dashboard/recommendation-data.ts');
        const { emptyContactFilters } = await import('../../lib/email-contacts.ts');
        const { currentEmployee } = await import('../../lib/current-employee.ts');

        await t.test('page authorization reads current Employee.role rather than stale cookie roles', async () => {
            globalThis.featureTestSession = { userId: 1, userRoles: ['ADMIN'] };
            assert.deepEqual((await currentEmployee()).roles, ['ADMIN']);
            await client.query(`UPDATE public."Employee" SET role=ARRAY['LECTURER'] WHERE "personId"=1`);
            assert.deepEqual((await currentEmployee()).roles, ['LECTURER']);
            await client.query(`UPDATE public."Employee" SET role=ARRAY['ADMIN'] WHERE "personId"=1`);
            globalThis.featureTestSession = { userId: 999 };
            assert.equal(await currentEmployee(), null);
            globalThis.featureTestSession = { userId: '1' };
            assert.equal(await currentEmployee(), null);
        });

        await t.test('nullable emails, person roles, organizations and branch-name keys load', async () => {
            const contacts = await loadEmailContacts();
            const teacher = contacts.find(c => c.id === 2), student = contacts.find(c => c.id === 3);
            assert.equal(teacher.school, 'School'); assert.equal(teacher.role, 'TEACHER');
            assert.equal(teacher.branchId, 'PRAHA'); assert.equal(teacher.region, 'PRAHA');
            assert.equal(student.email, '');
        });
        await t.test('snapshots reapply filters and remain private to their employee owner', async () => {
            const saved = await actions.saveEmailSegment('Teachers', { ...emptyContactFilters, role: 'TEACHER' });
            assert.equal(saved.contactCount, 1);
            assert.equal((await actions.getEmailSegment(saved.id)).contacts[0].id, 2);
            globalThis.featureTestEmployee = { id: 5, roles: ['ADMIN'] };
            await assert.rejects(actions.getEmailSegment(saved.id), /not found/);
            await assert.rejects(actions.deleteEmailSegment(saved.id), /not found/);
            globalThis.featureTestEmployee = { id: 1, roles: ['LECTURER'] };
            await assert.rejects(actions.saveEmailSegment('No access', emptyContactFilters), /Only administrators/);
            globalThis.featureTestEmployee = { id: 1, roles: ['ADMIN'] };
            await actions.deleteEmailSegment(saved.id);
        });

        const ccSecret = 'test-mailbox-secret-'.repeat(3);
        Object.assign(process.env, { EMAIL_TRACKING_CC_ADDRESS: 'tracking@example.test', EMAIL_TRACKING_WEBHOOK_SECRET: ccSecret });
        const metadata = { senderVerified: true, messageId: '<test-1@example.test>', from: 'ADMIN@example.test',
            to: ['Teacher@example.test'], cc: ['tracking@example.test'], sentAt: '2026-01-10T23:30:00Z' };
        const trackRequest = (data = metadata, token = ccSecret) => new Request('http://localhost/api/email-tracking', {
            method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(data),
        });
        await t.test('CC authentication, sender verification and mailbox validation are enforced', async () => {
            assert.equal((await track(trackRequest(metadata, 'wrong'))).status, 401);
            assert.equal((await track(trackRequest({ ...metadata, senderVerified: false }))).status, 403);
            assert.equal((await track(trackRequest({ ...metadata, from: 'teacher@example.test' }))).status, 403);
            assert.equal((await track(trackRequest({ ...metadata, cc: [] }))).status, 400);
            assert.equal((await client.query('SELECT * FROM public."Interaction"')).rowCount, 0);
        });
        await t.test('CC writes existing interactions and Prague contact dates once, preserving newer manual dates', async () => {
            const response = await track(trackRequest()); assert.equal(response.status, 200);
            assert.equal((await response.json()).matchedContacts, 1);
            const person = (await client.query('SELECT "lastContactedDate"::text AS date,"lastContactedById","lastTrackedEmailAt" FROM public."Person" WHERE id=2')).rows[0];
            assert.equal(person.date, '2026-01-11'); assert.equal(person.lastContactedById, 1);
            assert.equal((await (await track(trackRequest())).json()).duplicate, true);
            assert.equal((await client.query('SELECT * FROM public."Interaction"')).rowCount, 1);
            assert.equal((await track(trackRequest({ ...metadata, sentAt: '2026-01-09T10:00:00Z' }))).status, 409);
            await client.query(`UPDATE public."Person" SET "lastContactedDate"='2026-02-01',"lastContactedById"=5 WHERE id=2`);
            assert.equal((await track(trackRequest({ ...metadata, messageId: '<older@example.test>', sentAt: '2026-01-01T10:00:00Z' }))).status, 200);
            const after = (await client.query('SELECT "lastContactedDate"::text AS date,"lastContactedById" FROM public."Person" WHERE id=2')).rows[0];
            assert.equal(after.date, '2026-02-01'); assert.equal(after.lastContactedById, 5);
        });

        Object.assign(process.env, { SMARTEMAILING_USERNAME: 'api@example.test', SMARTEMAILING_API_KEY: 'test-only',
            SMARTEMAILING_EVENT_STREAM_ID: 'test-stream', SMARTEMAILING_SYNC_SECRET: 'test-stream-secret-'.repeat(3) });
        let failAck = false, pending = true, ackCount = 0;
        const event = (id, type) => ({ id, source: '/accounts/test', type: `email.${type}`, time: '2026-02-02T12:00:00Z',
            data: { email_message_id: 'newsletter-1', contact: { emailaddress: 'TEACHER@example.test' },
                email_statistic: { name: 'Newsletter', type: 'campaign', template: { subject: 'News' } } } });
        globalThis.fetch = async (input, options) => {
            const path = new URL(input).pathname;
            assert.equal(new URL(input).origin, 'https://app.smartemailing.cz');
            if (path.endsWith('/ack')) {
                ackCount++;
                if (failAck) return new Response('', { status: 500 });
                pending = false; return new Response(null, { status: 204 });
            }
            assert.equal(options.method, 'GET');
            if (path.endsWith('/contactlists')) return Response.json({ status: 'ok', data: [{ id: 7, name: 'Teachers' }], meta: { total_count: 1 } });
            if (path.endsWith('/contacts')) return Response.json({ status: 'ok', data: [{ id: 10, emailaddress: 'teacher@example.test',
                hardbounced: 0, softbounced: 0, blacklisted: 0, contactlists: [{ contactlist_id: 7, status: 'confirmed' }] }], meta: { total_count: 1 } });
            return Response.json({ status: 'ok', data: pending ? [event('delivery', 'delivered'), event('open', 'opened')] : [],
                meta: { has_more: false, cursor: pending ? 'cursor-1' : null } });
        };
        const syncRequest = (token = process.env.SMARTEMAILING_SYNC_SECRET) => new Request('http://localhost/api/smartemailing/sync', {
            method: 'POST', headers: { Authorization: `Bearer ${token}` },
        });
        await t.test('SmartEmailing imports lists and events separately; failed ACK replay is safe', async () => {
            assert.equal((await sync(syncRequest('wrong'))).status, 401);
            failAck = true;
            assert.equal((await sync(syncRequest())).status, 502);
            assert.equal((await client.query('SELECT * FROM public."SmartEmailEvent"')).rowCount, 2);
            failAck = false;
            assert.equal((await sync(syncRequest())).status, 200);
            assert.equal((await client.query('SELECT * FROM public."SmartEmailEvent"')).rowCount, 2);
            assert.ok(ackCount >= 2);
            const details = await loadSmartEmailContact('Teacher@example.test');
            assert.equal(details.profile.lists[0].name, 'Teachers'); assert.equal(details.latestMessageOpened, true);
            assert.equal((await loadEmailContacts()).find(c => c.id === 2).smartEmailing.lists[0].id, 7);
            assert.equal((await client.query('SELECT * FROM public."Interaction"')).rowCount, 2);
            await client.query(`UPDATE public."SmartEmailSync" SET "lockUntil"=now()+interval '10 minutes',"lockToken"='test-other-worker'`);
            assert.equal((await (await sync(syncRequest())).json()).busy, true);
            await client.query(`UPDATE public."SmartEmailSync" SET "lockUntil"=NULL,"lockToken"=NULL`);
        });
        await t.test('switching the CC address needs no code changes and preserves existing history', async () => {
            const previousAddress = process.env.EMAIL_TRACKING_CC_ADDRESS;
            try {
                process.env.EMAIL_TRACKING_CC_ADDRESS = 'new-tracking@example.test';
                assert.equal((await track(trackRequest())).status, 400);
                const changed = { ...metadata, messageId: '<new-mailbox@example.test>', cc: ['new-tracking@example.test'] };
                assert.equal((await track(trackRequest(changed))).status, 200);
                assert.equal((await (await track(trackRequest(changed))).json()).duplicate, true);
                assert.equal((await client.query('SELECT * FROM public."Interaction"')).rowCount, 3);
                assert.equal((await client.query('SELECT * FROM public."TrackedEmail"')).rowCount, 3);
            } finally { process.env.EMAIL_TRACKING_CC_ADDRESS = previousAddress; }
        });
        await t.test('recommendations use real outreach, school/theatre types and skip undated/cancelled participation', async () => {
            await client.query(`TRUNCATE public."Interaction";
                UPDATE public."Person" SET "lastTrackedEmailAt"=NULL;
                INSERT INTO public."Interaction" ("personId","organizationId","contactedAt",mode) VALUES
                    (2,1,now()-interval '5 days','EMAIL'), (4,2,now()-interval '100 days','PHONE');
                INSERT INTO public."Participation" (name,"organizationId","startDate",status,"programType") VALUES
                    ('Unknown dates',3,NULL,'PLANNED','SCHOOL_NETWORK'),
                    ('Cancelled',3,now()-interval '1 day','CANCELLED','SCHOOL_NETWORK');`);
            const schools = await loadRecommendations(false), organizations = await loadRecommendations(true);
            assert.ok(schools.some(r => r.kind === 'organization' && r.id === 1 && !r.isReconnect));
            assert.ok(schools.some(r => r.kind === 'person' && r.id === 2));
            assert.ok(!schools.some(r => r.kind === 'organization' && [2,3].includes(r.id)));
            assert.ok(organizations.some(r => r.kind === 'organization' && r.id === 2 && r.isReconnect));
            assert.ok(!organizations.some(r => r.kind === 'person' && r.id === 3));
            const suggested = JSON.parse(schools.find(r => r.kind === 'organization' && r.id === 1).contacts);
            assert.equal(suggested[0].id, 2);
        });
    } finally {
        globalThis.fetch = originalFetch;
        if (runtime) await runtime.close();
        if (client) await client.end();
        await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
        await admin.end();
    }
});
