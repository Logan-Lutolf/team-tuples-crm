import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEditHistory } from '@/lib/edit-history'
import { changedFields, isHistoryType } from '@/lib/edit-history-policy'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function display(value: unknown) {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
}

export default async function EditHistoryPage({ params, searchParams }: {
    params: Promise<{ type: string; id: string }>
    searchParams: Promise<{ before?: string }>
}) {
    const { type, id: rawId } = await params
    const { before: rawBefore } = await searchParams
    const id = Number(rawId), before = rawBefore === undefined ? undefined : Number(rawBefore)
    if (!isHistoryType(type) || !/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id <= 0) notFound()
    if (before !== undefined && (!/^\d+$/.test(rawBefore!) || !Number.isSafeInteger(before) || before <= 0)) notFound()
    const { entries, hasMore } = await getEditHistory(type, id, before)
    const href = `/details/${type}/${id}`
    return <article className="m-10 grid min-w-0 gap-6">
        <Link href={href} className="w-fit underline">Back to details</Link>
        <header className="grid gap-2">
            <h1 className="text-2xl font-semibold">Edit history · {type}</h1>
            <p className="text-muted-foreground">Changes to this record and its relationships, newest first. History begins when tracking was enabled.</p>
        </header>
        {!entries.length && <p>No recorded changes{before ? ' on this page' : ' yet'}.</p>}
        {entries.map(entry => {
            const previous = entry.beforeData ? JSON.parse(entry.beforeData) : null
            const next = entry.afterData ? JSON.parse(entry.afterData) : null
            const fields = changedFields(previous, next)
            return <section key={entry.id} className="grid min-w-0 gap-3 rounded-lg border p-4">
                <header className="flex flex-wrap justify-between gap-2">
                    <div><h2 className="font-semibold">{entry.operation === 'INSERT' ? 'Created' : entry.operation === 'DELETE' ? 'Deleted' : 'Edited'} · {entry.sourceTable.replace(/([a-z])([A-Z])/g, '$1 $2')}</h2>
                        <p className="text-sm">By {entry.actorName}</p></div>
                    <time className="text-sm text-muted-foreground" dateTime={entry.changedAt}>{entry.changedAt.replace('T', ' ').replace(/Z$/, '')} UTC</time>
                </header>
                {fields.length ? <div className="overflow-x-auto"><Table>
                    <TableHeader><TableRow><TableHead>Field</TableHead><TableHead>Before</TableHead><TableHead>After</TableHead></TableRow></TableHeader>
                    <TableBody>{fields.map(change => <TableRow key={change.field}>
                        <TableCell className="align-top font-medium">{change.field}</TableCell>
                        <TableCell className="max-w-sm whitespace-pre-wrap break-words align-top">{display(change.before)}</TableCell>
                        <TableCell className="max-w-sm whitespace-pre-wrap break-words align-top">{display(change.after)}</TableCell>
                    </TableRow>)}</TableBody>
                </Table></div> : <p className="text-sm text-muted-foreground">Record {entry.operation === 'DELETE' ? 'removed' : 'added'}.</p>}
            </section>
        })}
        <nav aria-label="Edit history pages" className="flex gap-4">
            {before && <Link href={`${href}/edit-history`} className="underline">Newest changes</Link>}
            {hasMore && <Link href={`${href}/edit-history?before=${entries.at(-1)!.id}`} className="underline">Older changes</Link>}
        </nav>
    </article>
}
