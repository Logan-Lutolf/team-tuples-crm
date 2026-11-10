// Uses only a disposable LOCAL PostgreSQL instance, never DATABASE_URL.
// Start a local test server, then: MIGRATION_TEST_PORT=55439 node --test tests/migrations/branch-and-interaction.mjs
import { test } from 'node:test';
import { registerHooks } from 'node:module';
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
const migration = [...await load('20261103T1944_branch_and_interaction_updates'), ...await load('20261104T1742_contact_employment_history'), ...await load('20261104T1804_contact_program_participation')];
// Load server actions against the disposable runtime; never import the configured hosted DB.
registerHooks({ resolve(specifier, context, next) {
    if (specifier === '@/prisma/db') return { url: 'data:text/javascript,export const db = globalThis.branchTestDb;', shortCircuit: true };
    if (specifier === 'next/cache') return { url: 'data:text/javascript,export function revalidatePath() {}', shortCircuit: true };
    if (specifier === './branch-data' && context.parentURL?.endsWith('/app/branches/actions.ts')) return next(new URL('../../app/branches/branch-data.ts', import.meta.url).href, context);
    if (specifier === '../../lib/contact-employment' && (context.parentURL?.endsWith('/app/contacts/employment-actions.ts') || context.parentURL?.endsWith('/app/contacts/participation-actions.ts'))) return next(new URL('../../lib/contact-employment.ts', import.meta.url).href, context);
    return next(specifier, context);
}});

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
            await client.query('SELECT * FROM public."LegacySchoolEmployees"');
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
                globalThis.branchTestDb = runtime;
                // Empty fixture runs first, but actions are imported only for populated data.
                const actions = await import('../../app/branches/actions.ts');
                const form = values => {
                    const result = new FormData();
                    for (const [key, value] of Object.entries(values)) result.set(key, String(value));
                    return result;
                };
                const add = { 'branch-id': 1, operation: 'add-assignment', 'employee-id': 1, role: 'ADMIN', region: '', 'program-id': '' };
                assert.deepEqual(await actions.updateBranchRelationship(form(add)), { success: true });
                assert.deepEqual(await actions.updateBranchRelationship(form(add)), { success: true });
                const scoped = await runtime.orm.public.EmployeeAssignment.where({ branchId: 1 }).all().toArray();
                assert.equal(scoped.length, 1);
                assert.deepEqual(await actions.updateBranchRelationship(form({ ...add, operation: 'edit-assignment', 'assignment-id': scoped[0].id, role: 'NEWSLETTER_COORDINATOR' })), { success: true });
                const detail = await actions.getBranchDetails(1, true);
                assert.equal(detail.assignments[0].role, 'NEWSLETTER_COORDINATOR');
                assert.equal(detail.contacts.length, 1);
                assert.deepEqual(await actions.updateBranchRelationship(form({ 'branch-id': 1, operation: 'move-contact', 'contact-id': 1, destination: 2 })), { success: true });
                assert.equal((await runtime.orm.public.Contact.where({ id: 1 }).first()).branchId, 2);
                assert.deepEqual(await actions.updateBranchRelationship(form({ 'branch-id': 1, operation: 'assign-contact', 'contact-id': 1 })), { success: true });
                assert.deepEqual(await actions.updateBranchRelationship(form({ 'branch-id': 1, operation: 'edit-contact', 'contact-id': 1, name: 'Updated teacher', email: 'updated@example.com', phone: '123', contactRole: 'PRINCIPAL' })), { success: true });
                assert.equal((await runtime.orm.public.Contact.where({ id: 1 }).first()).name, 'Updated teacher');
                assert.deepEqual(await actions.updateBranchRelationship(form({ 'branch-id': 1, operation: 'remove-assignment', 'assignment-id': scoped[0].id })), { success: true });
                assert.equal((await runtime.orm.public.EmployeeAssignment.where({ employeeId: 1 }).all().toArray()).length, 1);
                assert.equal((await runtime.orm.public.Interaction.all().toArray()).length, 2);
                const invalid = await actions.updateBranchRelationship(form({ ...add, role: 'INVALID' }));
                assert.ok('error' in invalid);
                const employment = await import('../../app/contacts/employment-actions.ts');
                const employmentForm = { 'contact-id': 1, 'school-id': 1, 'job-title': 'Teacher', 'start-date': '2020-09-01', 'end-date': '2024-08-31', notes: 'Previous appointment' };
                assert.deepEqual(await employment.addContactEmployment(form(employmentForm)), { success: true });
                assert.deepEqual(await employment.addContactEmployment(form({ ...employmentForm, 'job-title': 'Department head', 'start-date': '2024-09-01', 'end-date': '' })), { success: true });
                const jobs = await runtime.orm.public.ContactEmployment.where({ contactId: 1 }).orderBy(e => e.startDate.desc()).all().toArray();
                assert.equal(jobs.length, 2);
                assert.equal(jobs[0].endDate, null);
                const otherContact = await runtime.orm.public.Contact.create({ name: 'Other teacher', email: 'otherteacher@example.com', contactRole: 'TEACHER', branchId: 1 });
                assert.ok('error' in await employment.editContactEmployment(form({ ...employmentForm, 'contact-id': otherContact.id, 'employment-id': jobs[0].id })));
                assert.ok('error' in await employment.deleteContactEmployment(form({ 'contact-id': otherContact.id, 'employment-id': jobs[0].id, confirmation: 'delete' })));
                assert.deepEqual(await employment.editContactEmployment(form({ ...employmentForm, 'employment-id': jobs[0].id, 'job-title': 'Principal', 'start-date': '2024-09-01', 'end-date': '' })), { success: true });
                assert.equal((await runtime.orm.public.ContactEmployment.where({ id: jobs[0].id }).first()).jobTitle, 'Principal');
                assert.ok('error' in await employment.addContactEmployment(form({ ...employmentForm, 'end-date': '2010-01-01' })));
                assert.equal((await runtime.orm.public.ContactEmployment.where({ contactId: 1 }).all().toArray()).length, 2);
                assert.deepEqual(await employment.deleteContactEmployment(form({ 'contact-id': 1, 'employment-id': jobs[0].id, confirmation: 'delete' })), { success: true });
                assert.equal((await runtime.orm.public.ContactEmployment.where({ contactId: 1 }).all().toArray()).length, 1);
                assert.equal((await runtime.orm.public.Contact.where({ id: 1 }).first()).schoolId, 1);
                const attendance = await import('../../app/contacts/participation-actions.ts');
                const attendanceForm = { 'contact-id': 1, 'participation-id': 1, operation: 'add' };
                assert.deepEqual(await attendance.changeContactParticipation(form(attendanceForm)), { success: true });
                assert.deepEqual(await attendance.changeContactParticipation(form(attendanceForm)), { success: true });
                assert.equal((await runtime.orm.public.ParticipationContacts.where({ contactId: 1 }).all().toArray()).length, 1);
                assert.deepEqual(await attendance.changeContactParticipation(form({ ...attendanceForm, operation: 'change', 'previous-participation-id': 1, 'participation-id': 2 })), { success: true });
                assert.equal((await runtime.orm.public.ParticipationContacts.where({ contactId: 1 }).first()).participationId, 2);
                assert.ok('error' in await attendance.changeContactParticipation(form({ ...attendanceForm, operation: 'change', 'previous-participation-id': 2, 'participation-id': 999999 })));
                assert.equal((await runtime.orm.public.ParticipationContacts.where({ contactId: 1 }).first()).participationId, 2);
                assert.ok('error' in await attendance.changeContactParticipation(form({ 'contact-id': otherContact.id, operation: 'change', 'previous-participation-id': 2, 'participation-id': 1 })));
                assert.deepEqual(await attendance.changeContactParticipation(form({ ...attendanceForm, 'contact-id': otherContact.id })), { success: true });
                assert.deepEqual(await attendance.changeContactParticipation(form({ ...attendanceForm, operation: 'remove', 'participation-id': 2 })), { success: true });
                assert.equal((await runtime.orm.public.ParticipationContacts.where({ contactId: 1 }).all().toArray()).length, 0);
                assert.equal((await runtime.orm.public.ParticipationContacts.where({ contactId: otherContact.id }).all().toArray()).length, 1);
                assert.equal((await runtime.orm.public.Participation.all().toArray()).length, 2);
                assert.equal((await runtime.orm.public.Contact.where({ id: 1 }).first()).schoolId, 1);


                const programActions = await import('../../app/programs/actions.ts');
                const assignmentForm = { 'program-id': 1, operation: 'add-assignment', 'employee-id': 1, role: 'ADMIN', 'branch-id': '', region: '' };
                assert.deepEqual(await programActions.changeProgramRelationship(form(assignmentForm)), { success: true });
                assert.deepEqual(await programActions.changeProgramRelationship(form(assignmentForm)), { success: true });
                const programAssignments = await runtime.orm.public.EmployeeAssignment.where({ programId: 1 }).all().toArray();
                assert.equal(programAssignments.length, 1);
                assert.deepEqual(await programActions.changeProgramRelationship(form({ ...assignmentForm, operation: 'edit-assignment', 'assignment-id': programAssignments[0].id, role: 'WORKSHOPS_COORDINATOR' })), { success: true });
                const programDetails = await programActions.getProgramDetails(1, true);
                assert.equal(programDetails.assignments[0].role, 'WORKSHOPS_COORDINATOR');
                assert.equal(programDetails.participations.length, 2);
                assert.equal(programDetails.employees.length, 2);
                assert.deepEqual(await programActions.changeProgramRelationship(form({ 'program-id': 1, operation: 'remove-assignment', 'assignment-id': programAssignments[0].id })), { success: true });
                assert.equal((await runtime.orm.public.EmployeeAssignment.where({ employeeId: 1 }).all().toArray()).length, 1);

                const municipalities = await import('../../app/municipalities/actions.ts');
                assert.ok('error' in await municipalities.saveMunicipality(form({ name: '', mayor: '' })));
                assert.deepEqual(await municipalities.saveMunicipality(form({ name: 'Test town', mayor: 'Test mayor' })), { success: true });
                const town = await runtime.orm.public.Municipality.where({ name: 'Test town' }).first();
                assert.deepEqual(await municipalities.saveMunicipality(form({ id: town.id, name: 'Updated town', mayor: 'New mayor' })), { success: true });
                const sponsorship = { 'municipality-id': town.id, 'program-id': 1, operation: 'add' };
                assert.deepEqual(await municipalities.changeMunicipalityProgram(form(sponsorship)), { success: true });
                assert.deepEqual(await municipalities.changeMunicipalityProgram(form(sponsorship)), { success: true });
                const townDetails = await municipalities.getMunicipalityDetails(town.id, true);
                assert.equal(townDetails.municipality.mayor, 'New mayor');
                assert.equal(townDetails.programs.length, 1);
                assert.equal(townDetails.availablePrograms.length, 0);
                assert.deepEqual(await programActions.changeProgramRelationship(form({ 'program-id': 1, 'municipality-id': town.id, operation: 'add-sponsor' })), { success: true });
                assert.equal((await programActions.getProgramDetails(1, true)).municipalities.length, 1);

                assert.ok('error' in await municipalities.deleteMunicipality(form({ id: town.id, confirmation: 'delete' })));
                assert.deepEqual(await municipalities.changeMunicipalityProgram(form({ ...sponsorship, operation: 'remove' })), { success: true });
                assert.ok(await runtime.orm.public.Program.where({ id: 1 }).first());
                assert.deepEqual(await municipalities.deleteMunicipality(form({ id: town.id, confirmation: 'delete' })), { success: true });
                assert.equal(await runtime.orm.public.Municipality.where({ id: town.id }).first(), null);


            }
        } finally { await runtime.close(); }
        const archiveRemoval = await load('20261104T1749_remove_school_employee_archive');
        const countsSql = `SELECT (SELECT count(*) FROM public."School") AS schools,
            (SELECT count(*) FROM public."Employee") AS employees,
            (SELECT count(*) FROM public."ContactEmployment") AS employment,
            (SELECT count(*) FROM public."Interaction") AS interactions`;
        const beforeRemoval = (await client.query(countsSql)).rows;
        await client.query('BEGIN');
        for (const op of archiveRemoval) await execute(client, op.execute);
        assert.equal((await client.query(`SELECT to_regclass('public."LegacySchoolEmployees"') AS archive`)).rows[0].archive, null);
        await client.query('ROLLBACK');
        assert.equal((await client.query('SELECT count(*)::int AS n FROM public."LegacySchoolEmployees"')).rows[0].n, populated ? 2 : 0);
        for (const op of archiveRemoval) await execute(client, op.execute);
        assert.equal((await client.query(`SELECT to_regclass('public."LegacySchoolEmployees"') AS archive`)).rows[0].archive, null);
        assert.deepEqual((await client.query(countsSql)).rows, beforeRemoval);


    } finally {
        await client?.end();
        await admin.query(`DROP DATABASE IF EXISTS "${database}"`);
        await admin.end();
    }
});
