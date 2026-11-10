import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { userInfo } from 'node:os'
import { randomBytes } from 'node:crypto'
import pg from 'pg'

const port = Number(process.env.MIGRATION_TEST_PORT)
if (!Number.isSafeInteger(port) || port <= 0) throw new Error('Set MIGRATION_TEST_PORT to a disposable local PostgreSQL server.')
const config = { host: '127.0.0.1', port, user: userInfo().username }
const root = new URL('../../migrations/app/', import.meta.url)
const directories = (await readdir(root)).filter(name => /^\d{8}T/.test(name)).sort()
const mainTables = ['Branch', 'School', 'Contact', 'Employee', 'Program', 'Municipality']

for (const target of mainTables) test(`deleting ${target} automatically clears links and preserves other main records`, async () => {
    const database = `delete_test_${randomBytes(8).toString('hex')}`
    const admin = new pg.Client({ ...config, database: 'postgres' })
    let client
    await admin.connect()
    try {
        await admin.query(`CREATE DATABASE "${database}"`)
        client = new pg.Client({ ...config, database })
        await client.connect()
        for (const directory of directories) {
            const ops = JSON.parse(await readFile(new URL(`${directory}/ops.json`, root), 'utf8'))
            for (const op of ops) {
                for (const step of op.execute ?? []) await client.query(step.sql, step.params)
                for (const step of op.postcheck ?? []) {
                    const check = await client.query(step.sql, step.params)
                    assert.equal(Object.values(check.rows[0])[0], true, `${directory}: ${op.id}`)
                }
            }
        }
        await client.query(`
            INSERT INTO public."Employee" (id,name,email,password,roles,"updatedAt") VALUES (1,'Employee','employee@example.com','!test-only-disabled',ARRAY[]::text[],now()),(2,'Other employee','other@example.com','!test-only-disabled-2',ARRAY[]::text[],now());
            INSERT INTO public."Branch" (id,name,region,"chiefId") VALUES (1,'ONE','ONE',1);
            INSERT INTO public."School" (id,name,email,address,type,relationship,region,"branchId","updatedAt") VALUES (1,'School','school@example.com','{}','PRIMARY','AVERAGE','ONE',1,now());
            INSERT INTO public."Contact" (id,name,email,"contactRole","schoolId","branchId","last_contacted_byId","updatedAt") VALUES (1,'Teacher','teacher@example.com','TEACHER',1,1,1,now());
            INSERT INTO public."Program" (id,name,"updatedAt") VALUES (1,'Program',now());
            INSERT INTO public."Municipality" (id,name,mayor) VALUES (1,'Town','Mayor');
            INSERT INTO public."MunicipalityPrograms" ("municipalityId","programId") VALUES (1,1);
            INSERT INTO public."Participation" (id,name,"schoolId","programId","startDate") VALUES (1,'Seminar',1,1,now());
            INSERT INTO public."ParticipationEmployees" ("participationId","employeeId") VALUES (1,1);
            INSERT INTO public."ParticipationContacts" ("participationId","contactId") VALUES (1,1);
            INSERT INTO public."EmployeeAssignment" ("employeeId","role","branchId","programId") VALUES (1,'ADMIN',1,1),(2,'LECTURER',NULL,NULL);
            INSERT INTO public."Interaction" (id,"employeeId","contactId","schoolId","programId",mode) VALUES (1,1,1,1,1,'EMAIL');
            INSERT INTO public."ContactEmployment" ("contactId","schoolId","jobTitle","startDate") VALUES (1,1,'Teacher',now());
        `)
        await client.query('BEGIN')
        await client.query(`DELETE FROM public."${target}" WHERE id=1`)
        await client.query('ROLLBACK')
        assert.equal((await client.query('SELECT "employeeId","contactId","schoolId","programId" FROM public."Interaction" WHERE id=1')).rows[0].employeeId, 1)
        for (const table of mainTables) assert.equal((await client.query(`SELECT count(*)::int n FROM public."${table}"`)).rows[0].n, table === 'Employee' ? 2 : 1)
        await client.query(`DELETE FROM public."${target}" WHERE id=1`)
        for (const table of mainTables) assert.equal((await client.query(`SELECT count(*)::int n FROM public."${table}"`)).rows[0].n, (table === 'Employee' ? 2 : 1) - (table === target ? 1 : 0), `preserve ${table}`)
        const history = (await client.query('SELECT * FROM public."Interaction" WHERE id=1')).rows[0]
        assert.ok(history, 'communication history preserved')
        assert.equal((await client.query('SELECT count(*)::int n FROM public."Participation"')).rows[0].n, 1)
        if (target === 'Branch') {
            assert.equal((await client.query('SELECT "branchId" FROM public."School"')).rows[0].branchId, null)
            assert.equal((await client.query('SELECT "branchId" FROM public."Contact"')).rows[0].branchId, null)
        }
        if (target === 'School') {
            assert.equal(history.schoolId, null)
            assert.equal((await client.query('SELECT "schoolId" FROM public."Participation"')).rows[0].schoolId, null)
            assert.equal((await client.query('SELECT "schoolId" FROM public."ContactEmployment"')).rows[0].schoolId, null)
            assert.equal((await client.query('SELECT "schoolId" FROM public."Contact"')).rows[0].schoolId, null)
        }
        if (target === 'Program') {
            assert.equal(history.programId, null)
            assert.equal((await client.query('SELECT "programId" FROM public."Participation"')).rows[0].programId, null)
        }
        if (target === 'Employee') {
            assert.equal(history.employeeId, null)
            assert.equal((await client.query('SELECT "chiefId" FROM public."Branch"')).rows[0].chiefId, null)
            assert.equal((await client.query('SELECT "last_contacted_byId" FROM public."Contact"')).rows[0].last_contacted_byId, null)
            assert.equal((await client.query('SELECT count(*)::int n FROM public."ParticipationEmployees"')).rows[0].n, 0)
        }
        if (target === 'Contact') {
            assert.equal(history.contactId, null)
            assert.equal((await client.query('SELECT count(*)::int n FROM public."ParticipationContacts"')).rows[0].n, 0)
            assert.equal((await client.query('SELECT count(*)::int n FROM public."ContactEmployment"')).rows[0].n, 0)
        }
        if (target === 'Municipality' || target === 'Program') assert.equal((await client.query('SELECT count(*)::int n FROM public."MunicipalityPrograms"')).rows[0].n, 0)
        if (['Employee','Branch','Program'].includes(target)) assert.deepEqual((await client.query('SELECT "employeeId" FROM public."EmployeeAssignment"')).rows, [{ employeeId: 2 }])
    } finally {
        await client?.end()
        await admin.query(`DROP DATABASE IF EXISTS "${database}"`)
        await admin.end()
    }
})
