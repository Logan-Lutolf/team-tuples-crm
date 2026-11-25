import Link from 'next/link'
import { notFound } from 'next/navigation'
import { currentEmployee } from '@/lib/current-employee'
import { db } from '@/prisma/db'

const recordTypes = ['Program instance', 'Program', 'Branch', 'Municipality', 'Organization', 'Employee']
const dateFormat = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Europe/Prague',
})
const operations: Record<string, string> = { INSERT: 'Added', UPDATE: 'Edited', DELETE: 'Removed' }
const pageSize = 50

function displayValue(value: string | null) {
    if (value === null) return '—'
    const parsed: unknown = JSON.parse(value)
    if (parsed === null) return 'None'
    if (typeof parsed === 'string') return parsed || 'Empty text'
    return JSON.stringify(parsed, null, 2)
}

export default async function AuditLogPage({ searchParams }: {
    searchParams: Promise<{ type?: string; name?: string; before?: string }>
}) {
    const employee = await currentEmployee()
    if (!employee?.roles.includes('ADMIN')) notFound()

    const params = await searchParams
    const type = typeof params.type === 'string' && recordTypes.includes(params.type) ? params.type : ''
    const name = typeof params.name === 'string' ? params.name.trim() : ''
    const before = typeof params.before === 'string' && /^\d{1,18}$/.test(params.before) ? params.before : ''

    const entries = await db.runtime().query(db.raw.sql`
        SELECT edit.id::text, edit.record_type, names.record_name, edit.operation, edit.field,
            edit.before_value::text, edit.after_value::text, edit.edited_at,
            CASE WHEN edit.editor_name = 'Employee #' || edit.editor_id::text
                THEN 'Unknown employee' ELSE edit.editor_name END AS editor_name
        FROM crm_audit.record_edit edit
        CROSS JOIN LATERAL (
            -- Older relationship entries may only have the parent ID.
            SELECT coalesce(nullif(edit.record_name, ''), CASE edit.record_type
                WHEN 'Program instance' THEN (SELECT name FROM public."Participation" WHERE id = edit.record_id::int)
                WHEN 'Municipality' THEN (SELECT name FROM public."Municipality" WHERE id = edit.record_id::int)
            END, (
                SELECT nullif(previous.record_name, '')
                FROM crm_audit.record_edit previous
                WHERE previous.record_type = edit.record_type AND previous.record_id = edit.record_id
                  AND nullif(previous.record_name, '') IS NOT NULL
                ORDER BY previous.id DESC
                LIMIT 1
            )) AS record_name
        ) names
        WHERE (${type}::text = '' OR edit.record_type = ${type}::text)
          AND (${name}::text = '' OR strpos(lower(names.record_name), lower(${name}::text)) > 0)
          AND (nullif(${before}::text, '') IS NULL OR edit.id < nullif(${before}::text, '')::bigint)
        ORDER BY edit.id DESC
        LIMIT ${pageSize + 1}::int
    `.returnsRow({
        id: { codecId: 'pg/text@1' },
        record_type: { codecId: 'pg/text@1' },
        record_name: { codecId: 'pg/text@1', nullable: true },
        operation: { codecId: 'pg/text@1' },
        field: { codecId: 'pg/text@1' },
        before_value: { codecId: 'pg/text@1', nullable: true },
        after_value: { codecId: 'pg/text@1', nullable: true },
        edited_at: { codecId: 'pg/timestamptz-string@1' },
        editor_name: { codecId: 'pg/text@1' },
    }).build())
    const nextPage = new URLSearchParams({ type, name, before: entries[pageSize - 1]?.id ?? '' })

    return (
        <main className="m-6 grid gap-4 lg:m-10">
            <h1 className="text-2xl font-semibold">Edit history</h1>
            <form className="flex flex-wrap items-end gap-3">
                <label className="grid gap-1">Record type
                    <select name="type" defaultValue={type} className="rounded-md border bg-background p-2">
                        <option value="">All types</option>
                        {recordTypes.map(recordType => <option key={recordType}>{recordType}</option>)}
                    </select>
                </label>
                <label className="grid gap-1">Record name
                    <input name="name" type="search" defaultValue={name} className="rounded-md border bg-background p-2" />
                </label>
                <button className="rounded-md border bg-background px-4 py-2">Filter</button>
            </form>
            {entries.length === 0 ? <p>No changes found.</p> : (
                <div className="overflow-x-auto rounded-md border bg-background">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b">
                                {['Record', 'Type', 'Change', 'Before', 'After', 'When (Prague time)', 'Edited by'].map(label => (
                                    <th key={label} scope="col" className="p-3">{label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {entries.slice(0, pageSize).map(entry => (
                                <tr key={entry.id} className="border-b align-top">
                                    <th scope="row" className="p-3 font-medium">
                                        {entry.record_name ? (
                                            <Link className="underline" href={`/audit-log?${new URLSearchParams({ type: entry.record_type, name: entry.record_name })}`}>
                                                {entry.record_name}
                                            </Link>
                                        ) : 'Unnamed record'}
                                    </th>
                                    <td className="p-3">{entry.record_type}</td>
                                    <td className="p-3">{operations[entry.operation]} · {entry.field}</td>
                                    <td className="whitespace-pre-wrap wrap-anywhere p-3">{displayValue(entry.before_value)}</td>
                                    <td className="whitespace-pre-wrap wrap-anywhere p-3">{displayValue(entry.after_value)}</td>
                                    <td className="p-3"><time dateTime={entry.edited_at}>{dateFormat.format(new Date(entry.edited_at))}</time></td>
                                    <td className="p-3">{entry.editor_name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <nav aria-label="History pages" className="flex gap-4">
                {before && <Link className="underline" href={`/audit-log?${new URLSearchParams({ type, name })}`}>Newest changes</Link>}
                {entries.length > pageSize && <Link className="underline" href={`/audit-log?${nextPage}`}>Older changes</Link>}
            </nav>
        </main>
    )
}
