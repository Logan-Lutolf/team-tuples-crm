// Uses only a disposable LOCAL PostgreSQL server. Never reads DATABASE_URL.
// MIGRATION_TEST_PORT=55439 node --test tests/migrations/edit-history.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { spawnSync } from 'node:child_process';
import { userInfo } from 'node:os';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson from '../../prisma/contract.json' with { type: 'json' };
import { canViewEditHistory, changedFields } from '../../lib/edit-history-policy.ts';

const port = Number(process.env.MIGRATION_TEST_PORT);
if (!Number.isSafeInteger(port) || port <= 0) throw new Error('Set MIGRATION_TEST_PORT to a disposable local PostgreSQL server port.');
const config = { host: '127.0.0.1', port, user: userInfo().username };
registerHooks({ resolve(specifier, context, next) {
    if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true };
    if (specifier === '@/prisma/db') return { url: 'data:text/javascript,export const db = globalThis.historyTestDb;', shortCircuit: true };
    if (specifier === '@/app/login/sessions') return { url: 'data:text/javascript,export async function decrypt() { return globalThis.historyTestSession; }', shortCircuit: true };
    if (specifier === 'next/headers') return { url: 'data:text/javascript,export async function cookies() { return { get() { return globalThis.historyTestSession ? {value:"session"} : undefined; } }; }', shortCircuit: true };
    if (specifier === 'next/navigation') return { url: 'data:text/javascript,export function notFound() { throw new Error("NOT_FOUND"); } export function redirect(path) { throw new Error("REDIRECT:"+path); }', shortCircuit: true };
    if (specifier.startsWith('@/lib/')) return next(new URL(`../../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    return next(specifier, context);
}});

test('edit history tracks search records atomically and enforces current roles', async t => {
    const database = `history_test_${randomBytes(8).toString('hex')}`;
    const admin = new pg.Client({ ...config, database: 'postgres' });
    await admin.connect();
    let client, runtime;
    try {
        await admin.query(`CREATE DATABASE "${database}"`);
        client = new pg.Client({ ...config, database });
        await client.connect();
        const url = `postgresql://${encodeURIComponent(config.user)}@127.0.0.1:${port}/${database}`;
        const runMigration = (...args) => {
            const result = spawnSync(process.execPath, ['node_modules/prisma/dist/prisma.js', 'db', 'migrate', ...args], {
                cwd: new URL('../../', import.meta.url), encoding: 'utf8', timeout: 30000,
                env: { ...process.env, DATABASE_URL: url, DO_NOT_TRACK: '1' },
            });
            assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
        };
        // Exercise the actual CLI runner and marker handling, not only the emitted SQL.
        runMigration('--to', '7df83bf378c9e77aa7a1288e9351e396beefb8f71c77c6d7e0273b03e96631d6');
        await client.query(`INSERT INTO public."Program" (id,name,"updatedAt") VALUES (99,'Existing program',now())`);
        runMigration();
        runMigration(); // Applying an already installed migration is a no-op.
        assert.equal((await client.query('SELECT name FROM public."Program" WHERE id=99')).rows[0].name, 'Existing program');
        runtime = postgres({ contractJson, url: `postgresql://${encodeURIComponent(config.user)}@127.0.0.1:${port}/${database}` });
        globalThis.historyTestDb = runtime;
        const { auditTransaction } = await import('../../lib/audit-transaction.ts');
        const { getEditHistory } = await import('../../lib/edit-history.ts');
        const { currentEmployee } = await import('../../lib/current-employee.ts');
        await client.query(`INSERT INTO public."Employee" (id,name,email,password,roles,"updatedAt") VALUES
            (1,'Admin Editor','admin@example.test','test-only',ARRAY['ADMIN'],now()),
            (2,'Lecturer','lecturer@example.test','test-only',ARRAY['LECTURER'],now());
            INSERT INTO public."Branch" (id,name,region,"chiefId") VALUES (1,'ONE','ONE',1),(2,'TWO','TWO',NULL);
            INSERT INTO public."School" (id,name,address,email,type,relationship,region,"branchId","updatedAt")
                VALUES (1,'School','{"street":"Old street","city":"Prague","country":"CZ","zipCode":"10000"}','school@example.test','PRIMARY','AVERAGE','ONE',1,now()),
                       (2,'Second school','{}','second@example.test','PRIMARY','AVERAGE','ONE',NULL,now());
            INSERT INTO public."Contact" (id,name,email,"contactRole","schoolId","branchId","updatedAt") VALUES (1,'Contact','contact@example.test','TEACHER',1,1,now());
            INSERT INTO public."Program" (id,name,"updatedAt") VALUES (1,'Program',now());
            INSERT INTO public."Municipality" (id,name,mayor) VALUES (1,'Town','Mayor');
            TRUNCATE public."EditHistory" RESTART IDENTITY;`);
        globalThis.historyTestSession = { userId: 1, userRoles: ['ADMIN'] };
        const history = async (type, id) => (await client.query('SELECT * FROM public."EditHistory" WHERE "recordType"=$1 AND "recordId"=$2 ORDER BY id', [type, id])).rows;

        await t.test('all five record types retain field values and authenticated editor', async () => {
            await auditTransaction(async tx => {
                await tx.orm.public.School.where({ id: 1 }).update({ name: 'New school', address: { street: 'New street', city: 'Prague', country: 'CZ', zipCode: '10000' } });
                await tx.orm.public.Contact.where({ id: 1 }).update({ name: 'New contact' });
                await tx.orm.public.Branch.where({ id: 1 }).update({ institute: 'New institute' });
                await tx.orm.public.Program.where({ id: 1 }).update({ description: 'New description' });
                await tx.orm.public.Municipality.where({ id: 1 }).update({ mayor: 'New mayor' });
            });
            for (const [type, table, field, before, after] of [
                ['schools','School','name','School','New school'], ['contacts','Contact','name','Contact','New contact'],
                ['branches','Branch','institute',null,'New institute'], ['programs','Program','description',null,'New description'],
                ['municipalities','Municipality','mayor','Mayor','New mayor'],
            ]) {
                const entry = (await history(type,1)).find(e => e.sourceTable === table);
                assert.equal(entry.actorId, 1); assert.equal(entry.actorName, 'Admin Editor');
                assert.ok(entry.changedAt);
                assert.ok(changedFields(JSON.parse(entry.beforeData),JSON.parse(entry.afterData)).some(c => c.field === field && c.before === before && c.after === after));
            }
            const entry = (await history('schools',1)).find(e => e.sourceTable === 'School');
            assert.ok(changedFields(JSON.parse(entry.beforeData),JSON.parse(entry.afterData)).some(c => c.field === 'address.street' && c.before === 'Old street' && c.after === 'New street'));
        });
        await t.test('moved relationships appear under both old and new parents', async () => {
            await auditTransaction(tx => tx.orm.public.Contact.where({ id: 1 }).update({ schoolId: 2, branchId: 2 }));
            for (const [type,id] of [['schools',1],['schools',2],['branches',1],['branches',2],['contacts',1]]) {
                assert.ok((await history(type,id)).some(e => e.sourceTable === 'Contact' && JSON.parse(e.afterData).schoolId === 2));
            }
        });
        await t.test('participation, employment, assignments, interactions, and sponsorship changes are included', async () => {
            await auditTransaction(async tx => {
                const participation = await tx.orm.public.Participation.create({ name: 'Visit', schoolId: 1, programId: 1, startDate: new Date().toISOString() });
                await tx.orm.public.ParticipationEmployees.create({ participationId: participation.id, employeeId: 1 });
                await tx.orm.public.ParticipationContacts.create({ participationId: participation.id, contactId: 1 });
                await tx.orm.public.ContactEmployment.create({ contactId: 1, schoolId: 1, jobTitle: 'Teacher', startDate: new Date().toISOString() });
                await tx.orm.public.EmployeeAssignment.create({ employeeId: 1, role: 'COORDINATOR', branchId: 1, programId: 1 });
                await tx.orm.public.MunicipalityPrograms.create({ municipalityId: 1, programId: 1 });
                await tx.orm.public.Interaction.create({ employeeId: 1, contactId: 1, schoolId: 1, programId: 1, mode: 'EMAIL' });
            });
            const sources = new Set((await history('schools',1)).map(e=>e.sourceTable));
            for (const source of ['Participation','ParticipationEmployees','ParticipationContacts','ContactEmployment','Interaction']) assert.ok(sources.has(source),source);
            assert.ok((await history('municipalities',1)).some(e=>e.sourceTable==='MunicipalityPrograms'));
            assert.ok((await history('branches',1)).some(e=>e.sourceTable==='EmployeeAssignment'));
        });
        await t.test('rollback and no-op writes never leave history; identities do not leak between transactions', async () => {
            const count = (await client.query('SELECT count(*)::int AS n FROM public."EditHistory"')).rows[0].n;
            await assert.rejects(auditTransaction(async tx => { await tx.orm.public.Program.where({id:1}).update({name:'Rolled back'}); throw new Error('rollback'); }), /rollback/);
            await auditTransaction(tx => tx.orm.public.Program.where({id:1}).update({name:'Program'}));
            assert.equal((await client.query('SELECT count(*)::int AS n FROM public."EditHistory"')).rows[0].n,count);
            await client.query('UPDATE public."Municipality" SET mayor=$1 WHERE id=1',['Database editor']);
            assert.equal((await history('municipalities',1)).at(-1).actorId,null);
            assert.equal((await history('municipalities',1)).at(-1).actorName,'System / database change');
        });
        await t.test('history access uses current persisted roles, including scoped assignments', async () => {
            for (const role of runtime.enums.public.Role.values) assert.equal(canViewEditHistory([role]), /ADMIN|COORDINATOR/.test(role),role);
            assert.equal(canViewEditHistory([]),false);
            assert.ok((await getEditHistory('schools',1)).entries.length);
            globalThis.historyTestSession = { userId: 2, userRoles: ['ADMIN'] }; // stale/forged role claim is ignored
            await assert.rejects(getEditHistory('schools',1), /NOT_FOUND/);
            await client.query(`INSERT INTO public."EmployeeAssignment" ("employeeId",role,"branchId") VALUES (2,'WORKSHOPS_COORDINATOR',1)`);
            assert.ok((await currentEmployee()).roles.includes('WORKSHOPS_COORDINATOR'));
            assert.ok((await getEditHistory('schools',1)).entries.length);
            await client.query('DELETE FROM public."EmployeeAssignment" WHERE "employeeId"=2');
            await assert.rejects(getEditHistory('schools',1), /NOT_FOUND/);
            globalThis.historyTestSession = null;
            await assert.rejects(getEditHistory('schools',1), /REDIRECT:\/login/);
            globalThis.historyTestSession = { userId: 9999 };
            await assert.rejects(getEditHistory('schools',1), /REDIRECT:\/login/);
            globalThis.historyTestSession = { userId: 1 };
        });
        await t.test('history paginates and survives record/editor deletion without storing credentials', async () => {
            for (let i=0;i<53;i++) await client.query('UPDATE public."Municipality" SET mayor=$1 WHERE id=1',[`Mayor ${i}`]);
            const first = await getEditHistory('municipalities',1);
            assert.equal(first.entries.length,50); assert.equal(first.hasMore,true);
            const second = await getEditHistory('municipalities',1,first.entries.at(-1).id);
            assert.ok(second.entries.length>0); assert.ok(second.entries.every(e=>e.id<first.entries.at(-1).id));
            await auditTransaction(tx => tx.orm.public.Employee.where({id:1}).update({name:'Renamed editor',password:'do-not-record',pfpImgUrl:'private-image'}));
            const employeeEntries = (await history('branches',1)).filter(e=>e.sourceTable==='Employee');
            assert.ok(employeeEntries.length);
            assert.equal(JSON.stringify(employeeEntries).includes('do-not-record'),false);
            assert.equal(JSON.stringify(employeeEntries).includes('private-image'),false);
            await auditTransaction(tx => tx.orm.public.Municipality.where({id:1}).delete());
            assert.ok((await history('municipalities',1)).some(e=>e.operation==='DELETE' && e.sourceTable==='Municipality'));
            await client.query('DELETE FROM public."Employee" WHERE id=1');
            assert.ok((await history('schools',1)).some(e=>e.actorId===1 && e.actorName==='Admin Editor'));
            assert.ok((await history('branches',1)).some(e=>e.sourceTable==='Branch' && JSON.parse(e.afterData).chiefId===null));
        });
    } finally {
        await runtime?.close();
        await client?.end();
        await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
        await admin.end();
        delete globalThis.historyTestDb;
        delete globalThis.historyTestSession;
    }
});
