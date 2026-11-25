import assert from 'node:assert/strict'
import { test } from 'node:test'
import pg from 'pg'
import { AuditPool } from '../../lib/audit-pool.mjs'

const database = new URL(process.env.DATABASE_URL ?? 'postgresql://localhost')
if (database.hostname !== '127.0.0.1' || database.pathname !== '/crm_audit_test') {
    throw new Error('Use a disposable local database named crm_audit_test with the audit SQL installed.')
}

test('PostgreSQL records all six record types, attributes edits, and redacts credentials', async () => {
    let editorId = null
    const pool = new AuditPool({ connectionString: database.href, max: 1 }, async () => editorId)

    try {
        const { rows: [editor] } = await pool.query('INSERT INTO "Person" (name, "updatedAt") VALUES (\'Test admin\', now()) RETURNING id')
        await pool.query('INSERT INTO "Employee" ("personId", password, "pfpImgUrl", role) VALUES ($1, $2, \'\', ARRAY[\'ADMIN\'])',
            [editor.id, 'test-secret-before'])
        editorId = editor.id

        const { rows: [program] } = await pool.query(`INSERT INTO "Program" (name, "updatedAt") VALUES ('Original program', now()) RETURNING id`)
        const { rows: [instance] } = await pool.query(`INSERT INTO "Participation" (name, "programType") VALUES ('Original instance', 'SCHOOL_NETWORK') RETURNING id`)
        const { rows: [municipality] } = await pool.query(`INSERT INTO "Municipality" (name, mayor) VALUES ('Test municipality', 'Old mayor') RETURNING id`)
        const { rows: [organization] } = await pool.query(`INSERT INTO "Organization" (name, "updatedAt") VALUES ('Original organization', now()) RETURNING id`)
        await pool.query(`INSERT INTO "Branch" (name, id, region, institute) VALUES ('PRAHA', 1, 'PRAHA', 'Old institute')`)

        const connection = await pool.connect()
        try {
            await connection.query('BEGIN')
            await connection.query('UPDATE "Program" SET name = $1 WHERE id = $2', ['Rolled back', program.id])
            await connection.query('ROLLBACK')

            await connection.query('BEGIN')
            await connection.query('UPDATE "Program" SET name = $1 WHERE id = $2', ['Edited program', program.id])
            await connection.query('UPDATE "Participation" SET name = $1 WHERE id = $2', ['Edited instance', instance.id])
            await connection.query('UPDATE "Municipality" SET mayor = $1 WHERE id = $2', ['New mayor', municipality.id])
            await connection.query('UPDATE "Organization" SET name = $1 WHERE id = $2', ['Edited organization', organization.id])
            await connection.query('UPDATE "Branch" SET institute = $1 WHERE id = 1', ['New institute'])
            await connection.query('UPDATE "Employee" SET "pfpImgUrl" = $1, password = $2 WHERE "personId" = $3',
                ['portrait.png', 'test-secret-after', editor.id])
            await connection.query('UPDATE "Person" SET phone = $1 WHERE id = $2', ['12345', editor.id])
            await connection.query('UPDATE "Program" SET name = name, "updatedAt" = now() WHERE id = $1', [program.id])
            await connection.query('INSERT INTO "ParticipationEmployees" ("participationId", "employeeId") VALUES ($1, $2)', [instance.id, editor.id])
            await connection.query('COMMIT')
        } finally {
            connection.release()
        }

        editorId = null
        await pool.query('DELETE FROM "Program" WHERE id = $1', [program.id])
        const client = new pg.Client({ connectionString: database.href })
        await client.connect()
        try {
            const { rows } = await client.query(`SELECT * FROM crm_audit.record_edit WHERE operation = 'UPDATE' ORDER BY id`)
            const changes = rows.map(row => [row.record_type, row.field, row.before_value, row.after_value])
            assert.equal(rows.length, 8)
            for (const change of [
                ['Program', 'name', 'Original program', 'Edited program'],
                ['Program instance', 'name', 'Original instance', 'Edited instance'],
                ['Municipality', 'mayor', 'Old mayor', 'New mayor'],
                ['Organization', 'name', 'Original organization', 'Edited organization'],
                ['Branch', 'institute', 'Old institute', 'New institute'],
                ['Employee', 'pfpImgUrl', '', 'portrait.png'],
                ['Employee', 'Password', '[redacted]', '[redacted]'],
                ['Employee', 'phone', null, '12345'],
            ]) assert.ok(changes.some(actual => JSON.stringify(actual) === JSON.stringify(change)))
            assert.ok(rows.every(row => row.editor_id === editor.id && row.editor_name === 'Test admin' &&
                Number.isFinite(row.edited_at.getTime())))
            const { rows: [link] } = await client.query(`SELECT * FROM crm_audit.record_edit WHERE field = 'Assigned employee'`)
            assert.deepEqual(link.after_value, { employeeId: editor.id })
            const { rows: [deletion] } = await client.query(`SELECT * FROM crm_audit.record_edit
                WHERE record_type = 'Program' AND operation = 'DELETE' AND field = 'name'`)
            assert.equal(deletion.editor_id, null)
            assert.match(deletion.editor_name, /^Database user /)
            assert.equal(deletion.before_value, 'Edited program')
            assert.equal(deletion.after_value, null)
            const { rows: [exposure] } = await client.query(`SELECT EXISTS (
                SELECT 1 FROM crm_audit.record_edit WHERE to_jsonb(record_edit)::text LIKE '%test-secret%'
            ) AS found`)
            assert.equal(exposure.found, false)
        } finally {
            await client.end()
        }
    } finally {
        await pool.end()
    }
})
