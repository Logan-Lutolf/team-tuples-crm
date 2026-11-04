// Uses only a disposable LOCAL PostgreSQL instance, never DATABASE_URL.
// Start a local test server, then: MIGRATION_TEST_PORT=55439 node --test tests/migrations/branch-and-interaction.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { userInfo } from 'node:os';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson from '../../prisma/contract.json' with { type: 'json' };
import { recordInteraction } from '../../lib/record-interaction.ts';

const port = Number(process.env.MIGRATION_TEST_PORT);
if (!Number.isSafeInteger(port) || port <= 0) throw new Error('Set MIGRATION_TEST_PORT to a disposable local PostgreSQL server port.');
const config = { host: '127.0.0.1', port, user: userInfo().username };
const load = async (dir) => JSON.parse(await readFile(new URL(`../../migrations/app/${dir}/ops.json`, import.meta.url), 'utf8'));
const previous = ['20261030T1456_baseline', '20261030T1457_add_contact_role', '20261030T1517_school_timestamps'];
const migration = await load('20261103T1944_branch_and_interaction_updates');

async function execute(client, steps) {
    for (const step of steps ?? []) await client.query(step.sql, step.params);
}

for (const populated of [false, true]) test(`migration preserves ${populated ? 'existing records' : 'an empty database'}`, async () => {
    const database = `migration_test_${randomBytes(8).toString('hex')}`;
    const admin = new pg.Client({ ...config, database: 'postgres' });
    await admin.connect();
    let client;
    try {
        await admin.query(`CREATE DATABASE "${database}"`);
        client = new pg.Client({ ...config, database });
        await client.connect();
        for (const dir of previous) for (const op of await load(dir)) await execute(client, op.execute);
        if (populated) await client.query(`
            INSERT INTO public."Branch" (name,region) VALUES ('ONE','THREE');
            INSERT INTO public."Employee" (id,name,email,role,region,"updatedAt") VALUES
              (1,'Alice','alice@example.com','ADMIN',NULL,now()),
              (2,'Bob','bob@example.com','WORKSHOPS_COORDINATOR','THREE',now());
            INSERT INTO public."School" (id,name,address,email,type,relationship,region,"branchId","updatedAt")
              VALUES (1,'School','{}','school@example.com','PRIMARY','AVERAGE','THREE',1,now());
            INSERT INTO public."Program" (id,name,"updatedAt") VALUES (1,'Seminar',now());
            INSERT INTO public."Participation" (id,"programId","schoolId","startDate") VALUES (1,1,1,now()),(2,1,1,now());
            INSERT INTO public."SchoolEmployees" ("schoolId","employeeId") VALUES (1,1),(1,2);
            INSERT INTO public."Contact" (name,email,"branchId","schoolId","contactRole","last_contacted_byId","updatedAt")
              VALUES ('Teacher','teacher@example.com',1,1,'TEACHER',1,now());
        `);
        async function apply() {
            for (const op of migration) {
                await execute(client, op.execute);
                // Backfill must not insert duplicate assignments if executed twice.
                if (op.id === 'backfill.EmployeeAssignment.roles') await execute(client, op.execute);
                for (const check of op.postcheck ?? []) {
                    const result = await client.query(check.sql, check.params);
                    assert.equal(Object.values(result.rows[0])[0], true, `${op.id}: ${check.description}`);
                }
            }
        }
        // Verify that the complete change can roll back without losing the old records.
        await client.query('BEGIN');
        await apply();
        await client.query('ROLLBACK');
        assert.equal((await client.query('SELECT count(*)::int AS n FROM public."SchoolEmployees"')).rows[0].n, populated ? 2 : 0);
        await client.query('SELECT role FROM public."Employee"');
        await client.query('BEGIN');
        await apply();
        await client.query('COMMIT');
        assert.equal((await client.query('SELECT count(*)::int AS n FROM public."LegacySchoolEmployees"')).rows[0].n, populated ? 2 : 0);
        assert.equal((await client.query('SELECT count(*)::int AS n FROM public."Interaction"')).rows[0].n, 0);
        assert.equal((await client.query('SELECT count(*)::int AS n FROM public."Contact"')).rows[0].n, populated ? 1 : 0);
        const assignments = (await client.query('SELECT "employeeId",role,region,"branchId","programId" FROM public."EmployeeAssignment" ORDER BY "employeeId"')).rows;
        assert.deepEqual(assignments, populated ? [
            { employeeId: 1, role: 'ADMIN', region: null, branchId: null, programId: null },
            { employeeId: 2, role: 'WORKSHOPS_COORDINATOR', region: 'THREE', branchId: null, programId: null },
        ] : []);
        assert.deepEqual((await client.query('SELECT name FROM public."Participation" ORDER BY id')).rows, populated ? [{ name: 'Participation #1' }, { name: 'Participation #2' }] : []);
        await client.query(`INSERT INTO public."Branch" (name,region,institute,"chiefId") VALUES ('TWO','ONE','Institute',${populated ? '1' : 'NULL'})`);
        const runtime = postgres({ contractJson, url: `postgresql://${encodeURIComponent(config.user)}@127.0.0.1:${port}/${database}` });
        try {
            await runtime.connect();
            // Exercise the ORM queries used by the migrated management pages.
            const employees = await runtime.orm.public.Employee.select('id', 'name', 'email', 'phone', 'region').all().toArray();
            assert.equal(employees.length, populated ? 2 : 0);
            await runtime.orm.public.EmployeeAssignment.select('employeeId', 'role').all().toArray();
            await runtime.orm.public.LegacySchoolEmployees.all().toArray();
            await runtime.orm.public.Participation.select('id', 'name', 'schoolId', 'programId', 'startDate', 'endDate', 'status').all().toArray();
            if (populated) {
                const data = { schoolId: 1, employeeId: 1, contactId: 1, programId: null, contactedAt: '2026-10-01T10:00:00.000Z', mode: 'EMAIL' };
                await runtime.transaction(tx => recordInteraction(tx, data));
                // Backdated records must not replace the latest summary.
                await runtime.transaction(tx => recordInteraction(tx, { ...data, employeeId: 2, contactedAt: '2026-09-01T10:00:00.000Z' }));
                const contact = await runtime.orm.public.Contact.where({ id: 1 }).first();
                assert.equal(contact.last_contacted_byId, 1);
                assert.equal(Date.parse(contact.last_contacted), Date.parse(data.contactedAt));
                await assert.rejects(runtime.transaction(tx => recordInteraction(tx, { ...data, schoolId: 999 })), /contact assigned/);
                assert.equal((await runtime.orm.public.Interaction.all().toArray()).length, 2);
            }
        } finally { await runtime.close(); }

    } finally {
        await client?.end();
        await admin.query(`DROP DATABASE IF EXISTS "${database}"`);
        await admin.end();
    }
});
