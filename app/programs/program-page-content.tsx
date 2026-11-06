'use client'
import { DeferredHistory } from '@/components/records/deferred-history'
import { PageContent, PageHeader, PageTitle, PageDescription } from '@/components/records/page-content'
import { RecordLink } from '@/components/records/record-link'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProgramRelationships } from './program-relationships'
import { deleteProgram, getProgramDetails, saveProgram } from './actions'
import type { Models } from '@/prisma/contract'
import type { Scalars } from '@prisma/orm-postgres/components'

type Program = Scalars<Models.public_Program>
type Details = Awaited<ReturnType<typeof getProgramDetails>>

function Submit({ deleting }: { deleting: boolean }) {
    const { pending } = useFormStatus()
    return <Button disabled={pending} type="submit" variant={deleting ? 'destructive' : 'default'}>{pending ? 'Saving…' : deleting ? 'Delete program' : 'Save program'}</Button>
}

function RecordList({ title, records }: { title: string; records: ReactNode[] }) {
    return <section className="grid gap-2"><h3 className="font-semibold">{title}</h3>{records.length ? <ul className="grid gap-2">{records.map((record, i) => <li className="rounded border p-3 whitespace-pre-wrap break-words" key={i}>{record}</li>)}</ul> : <p className="text-muted-foreground">No {title.toLowerCase()} recorded.</p>}</section>
}

export function ProgramPageContent({ program, mode = 'create', initialDetails }: { program?: Program; mode?: 'create' | 'view' | 'delete'; initialDetails?: Details }) {
    const [open, setOpen] = useState(true)
    const [editing, setEditing] = useState(false)
    const [details, setDetails] = useState<Details | null>(initialDetails ?? null)
    const [error, setError] = useState('')
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [revision, setRevision] = useState(0)
    const prefix = useId()
    const deleting = mode === 'delete'
    const formVisible = mode === 'create' || deleting || editing
    useEffect(() => {
        if (initialDetails && revision === 0) return
        if (!open || mode !== 'view' || !program) return
        let active = true
        setDetails(null)
        setError('')
        getProgramDetails(program.id, editing, true).then(data => { if (active) setDetails(data) }).catch(() => { if (active) setError('Could not load program details.') })
        return () => { active = false }
    }, [open, program?.id, mode, revision, initialDetails])
    async function openEdit() {
        if (!program) return
        setLoadingOptions(true)
        setError('')
        try { setDetails(await getProgramDetails(program.id, true)); setEditing(true) }
        catch { setError('Could not load editing options. Try again.') }
        finally { setLoadingOptions(false) }
    }
    async function refresh() { if (program) setDetails(await getProgramDetails(program.id, editing, true)) }
    const current = details?.program ?? program
    async function submit(form: FormData) {
        setError('')
        try {
            const result = await (deleting ? deleteProgram : saveProgram)(form)
            if ('error' in result) setError(result.error ?? 'Could not save changes.')
            else if (mode === 'create' || deleting) setOpen(false)
            else { await refresh() }
        } catch { setError('Could not submit changes. Check your connection and try again.') }
    }
    const title = mode === 'create' ? 'Add a Program' : deleting ? `Delete ${program?.name}` : editing ? `Edit ${current?.name}` : current?.name ?? 'Program details'
    const name = (items: { id: number; name: string }[], id: number | null) => id === null ? 'Unassigned / deleted' : items.find(item => item.id === id)?.name ?? `#${id}`
    return <PageContent open={open} backHref="/programs">

            <PageHeader><PageTitle>{title}</PageTitle><PageDescription>{deleting ? 'Related main records are kept and their program links are cleared automatically.' : formVisible ? 'Enter the program name and optional description.' : 'Program information and related records.'}</PageDescription></PageHeader>
            {error && <p role="alert" className="text-destructive">{error}</p>}
            {formVisible ? <div className="grid gap-6">
                {editing && <Button className="w-fit" variant="outline" onClick={() => { setEditing(false); setRevision(r => r + 1) }}>Back to details</Button>}
                <form action={submit} className="grid gap-4">
                {current && <input type="hidden" name="id" value={current.id} />}
                {deleting ? <label htmlFor={`${prefix}-confirmation`}>Type delete to confirm<Input id={`${prefix}-confirmation`} name="confirmation" required pattern="delete" autoComplete="off" /></label> : <>
                    <label htmlFor={`${prefix}-name`}>Name<Input id={`${prefix}-name`} name="name" defaultValue={current?.name ?? ''} required /></label>
                    <label htmlFor={`${prefix}-description`}>Description (optional)<textarea id={`${prefix}-description`} name="description" defaultValue={current?.description ?? ''} rows={4} className="block w-full rounded-md border border-input bg-transparent p-3" /></label>
                </>}
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => mode === 'view' ? setEditing(false) : setOpen(false)}>Cancel</Button>
                    <Submit deleting={deleting} />
                </div>
            </form>
                {editing && details && <ProgramRelationships data={details} onSaved={refresh} />}
            </div> : details ? <div className="grid gap-6">
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div><dt className="text-muted-foreground">Name</dt><dd>{details.program.name}</dd></div>
                    <div><dt className="text-muted-foreground">ID</dt><dd>{details.program.id}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-muted-foreground">Description</dt><dd className="whitespace-pre-wrap break-words">{details.program.description || '—'}</dd></div>
                    <div><dt className="text-muted-foreground">Created (UTC)</dt><dd>{details.program.createdAt}</dd></div>
                    <div><dt className="text-muted-foreground">Updated (UTC)</dt><dd>{details.program.updatedAt}</dd></div>
                </dl>
                <RecordList title="Participations" records={details.participations.map(p => <>{p.name} · <RecordLink type="schools" id={p.schoolId}>{name(details.schools, p.schoolId)}</RecordLink> · {p.status}<br />{p.startDate} – {p.endDate ?? 'No end date'}</>)} />
                <RecordList title="Employee assignments" records={details.assignments.map(a => <><RecordLink type="employees" id={a.employeeId}>{name(details.employees, a.employeeId)}</RecordLink> · {a.role.replaceAll('_', ' ')}{a.region ? ` · Region ${a.region}` : ''}{a.branchId ? <> · <RecordLink type="branches" id={a.branchId}>Branch #{a.branchId}</RecordLink></> : null}</>)} />
                <RecordList title="Municipal sponsors" records={details.municipalities.map(m => <><RecordLink type="municipalities" id={m.id}>{m.name}</RecordLink> · Mayor: {m.mayor}</>)} />
                <DeferredHistory key={details.program.updatedAt} type="programs" id={details.program.id} />
                <div className="flex justify-end border-t pt-4"><Button onClick={openEdit} disabled={loadingOptions}>{loadingOptions ? 'Loading editing options…' : 'Edit'}</Button></div>
            </div> : error ? <Button variant="outline" onClick={() => setRevision(r => r + 1)}>Try again</Button> : <p role="status">Loading program details…</p>}
    </PageContent>
}
