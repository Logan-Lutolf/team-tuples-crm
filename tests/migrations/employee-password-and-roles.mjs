import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { userInfo } from 'node:os'
import pg from 'pg'

const port = Number(process.env.MIGRATION_TEST_PORT)
if (!Number.isSafeInteger(port) || port <= 0) throw new Error('Set MIGRATION_TEST_PORT to a disposable local PostgreSQL port; DATABASE_URL is never used.')
const config = { host: '127.0.0.1', port, user: userInfo().username }
const root = new URL('../../migrations/app/', import.meta.url)
const target = '20261105T1816_employee_password_and_roles'
const previous = (await readdir(root)).filter(name => /^\d{8}T/.test(name) && name < target).sort()
const load = async dir => JSON.parse(await readFile(new URL(`${dir}/ops.json`, root), 'utf8'))
const operations = await load(target)
const execute = async (client, steps) => { for (const step of steps ?? []) await client.query(step.sql, step.params) }

for (const populated of [false, true]) test(`employee credential/roles migration: ${populated ? 'existing employees' : 'empty table'}`, async () => {
    const database = `employee_migration_${randomBytes(8).toString('hex')}`
    const admin = new pg.Client({ ...config, database: 'postgres' })
    let client
    await admin.connect()
    try {
        await admin.query(`CREATE DATABASE "${database}"`)
        client = new pg.Client({ ...config, database })
        await client.connect()
        for (const dir of previous) for (const op of await load(dir)) await execute(client, op.execute)
        if (populated) await client.query(`
            INSERT INTO public."Employee" (id,name,email,"updatedAt") VALUES (1,'One','one@example.com',now()),(2,'Two','two@example.com',now()),(3,'Three','three@example.com',now());
            INSERT INTO public."Branch" (id,name,region) VALUES (1,'ONE','ONE');
            INSERT INTO public."Program" (id,name,"updatedAt") VALUES (1,'Program',now());
            INSERT INTO public."EmployeeAssignment" ("employeeId",role,"branchId","programId",region) VALUES
              (1,'ADMIN',NULL,NULL,NULL),(1,'ADMIN',NULL,NULL,NULL),(1,'LECTURER',NULL,NULL,NULL),
              (1,'PROJECT_MANAGER',1,NULL,NULL),(1,'COORDINATOR',NULL,1,NULL),(1,'PRODUCTION',NULL,NULL,'ONE'),
              (2,'ADMIN',1,NULL,NULL);
        `)
        const original = (await client.query('SELECT * FROM public."Employee" ORDER BY id')).rows
        const originalAssignments = (await client.query('SELECT * FROM public."EmployeeAssignment" ORDER BY id')).rows
        async function apply() {
            for (const op of operations) {
                await execute(client, op.execute)
                if (op.operationClass === 'data') {
                    const before = (await client.query('SELECT password,roles FROM public."Employee" ORDER BY id')).rows
                    await execute(client, op.execute)
                    assert.deepEqual((await client.query('SELECT password,roles FROM public."Employee" ORDER BY id')).rows, before, 'backfill retries do not replace values')
                }
                for (const check of op.postcheck ?? []) {
                    const result = await client.query(check.sql, check.params)
                    assert.equal(Object.values(result.rows[0])[0], true, `${op.id}: ${check.description}`)
                }
            }
        }
        await client.query('BEGIN')
        await apply()
        await client.query('ROLLBACK')
        assert.deepEqual((await client.query('SELECT * FROM public."Employee" ORDER BY id')).rows, original)
        await client.query('BEGIN')
        await apply()
        await client.query('COMMIT')
        const employees = (await client.query('SELECT * FROM public."Employee" ORDER BY id')).rows
        assert.equal(employees.length, populated ? 3 : 0)
        assert.deepEqual(employees.map(e => e.roles), populated ? [['ADMIN', 'LECTURER'], [], []] : [])
        assert.equal(new Set(employees.map(e => e.password)).size, employees.length)
        for (const employee of employees) assert.match(employee.password, /^!setup-required\$sha256\$[0-9a-f]{64}$/)
        assert.deepEqual(employees.map(({ password, roles, ...fields }) => fields), original)
        assert.deepEqual((await client.query('SELECT * FROM public."EmployeeAssignment" ORDER BY id')).rows, originalAssignments)
        const columns = (await client.query(`SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='Employee' AND column_name IN ('password','roles') ORDER BY column_name`)).rows
        assert.deepEqual(columns, [{ column_name: 'password', is_nullable: 'NO', data_type: 'text' }, { column_name: 'roles', is_nullable: 'NO', data_type: 'ARRAY' }])
        if (populated) {
            await assert.rejects(client.query(`UPDATE public."Employee" SET roles=ARRAY['INVALID'] WHERE id=1`), e => e.code === '23514')
            await assert.rejects(client.query(`UPDATE public."Employee" SET roles=ARRAY[NULL]::text[] WHERE id=1`), e => e.code === '23514')
            await assert.rejects(client.query(`UPDATE public."Employee" SET password=NULL WHERE id=1`), e => e.code === '23502')
            await assert.rejects(client.query(`UPDATE public."Employee" SET roles=NULL WHERE id=1`), e => e.code === '23502')
        }
    } finally {
        await client?.end()
        await admin.query(`DROP DATABASE IF EXISTS "${database}"`)
        await admin.end()
    }
})
