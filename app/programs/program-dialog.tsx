'use client'

import { useEffect, useId, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { deleteProgram, getProgramDetails, saveProgram } from './actions'
import type { Models } from '@/prisma/contract'
import type { Scalars } from '@prisma/orm-postgres/components'

type Program = Scalars<Models.public_Program>
type Details = Awaited<ReturnType<typeof getProgramDetails>>

function Submit({ deleting }: { deleting: boolean }) {
    const { pending } = useFormStatus()
    return <Button disabled={pending} type="submit" variant={deleting ? 'destructive' : 'default'}>{pending ? 'Saving…' : deleting ? 'Delete program' : 'Save program'}</Button>
}

function RecordList({ title, records }: { title: string; records: string[] }) {
    return <section className="grid gap-2"><h3 className="font-semibold">{title}</h3>{records.length ? <ul className="grid gap-2">{records.map((record, i) => <li className="rounded border p-3 whitespace-pre-wrap break-words" key={i}>{record}</li>)}</ul> : <p className="text-muted-foreground">No {title.toLowerCase()} recorded.</p>}</section>
}

export function ProgramDialog({ program, mode = 'create' }: { program?: Program; mode?: 'create' | 'view' | 'delete' }) {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState(false)
    const [details, setDetails] = useState<Details | null>(null)
    const [error, setError] = useState('')
    const [revision, setRevision] = useState(0)
    const prefix = useId()
    const deleting = mode === 'delete'
    const formVisible = mode === 'create' || deleting || editing
    useEffect(() => {
        if (!open || mode !== 'view' || !program) return
        let active = true
        setDetails(null)
        setError('')
        getProgramDetails(program.id).then(data => { if (active) setDetails(data) }).catch(() => { if (active) setError('Could not load program details.') })
        return () => { active = false }
    }, [open, program, mode, revision])
    const current = details?.program ?? program
    async function submit(form: FormData) {
        setError('')
        try {
            const result = await (deleting ? deleteProgram : saveProgram)(form)
            if ('error' in result) setError(result.error ?? 'Could not save changes.')
            else if (mode === 'create' || deleting) setOpen(false)
            else { setEditing(false); setRevision(r => r + 1) }
        } catch { setError('Could not submit changes. Check your connection and try again.') }
    }
    const title = mode === 'create' ? 'Add a Program' : deleting ? `Delete ${program?.name}` : editing ? `Edit ${current?.name}` : current?.name ?? 'Program details'
    const name = (items: { id: number; name: string }[], id: number) => items.find(item => item.id === id)?.name ?? `#${id}`
    return <Dialog open={open} onOpenChange={value => { setOpen(value); setEditing(false); setError('') }}>
        <DialogTrigger render={<Button className={mode === 'create' ? 'w-full' : undefined} variant={deleting ? 'destructive' : mode === 'view' ? 'outline' : 'default'} aria-label={mode === 'view' ? `View details for ${program?.name}` : title} />}>
            {mode === 'create' ? 'Add a Program' : deleting ? 'Delete' : 'View details'}
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
            <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{deleting ? 'Programs with linked records cannot be deleted.' : formVisible ? 'Enter the program name and optional description.' : 'Program information and related records.'}</DialogDescription></DialogHeader>
            {error && <p role="alert" className="text-destructive">{error}</p>}
            {formVisible ? <form action={submit} className="grid gap-4">
                {current && <input type="hidden" name="id" value={current.id} />}
                {deleting ? <label htmlFor={`${prefix}-confirmation`}>Type delete to confirm<Input id={`${prefix}-confirmation`} name="confirmation" required pattern="delete" autoComplete="off" /></label> : <>
                    <label htmlFor={`${prefix}-name`}>Name<Input id={`${prefix}-name`} name="name" defaultValue={current?.name ?? ''} required /></label>
                    <label htmlFor={`${prefix}-description`}>Description (optional)<textarea id={`${prefix}-description`} name="description" defaultValue={current?.description ?? ''} rows={4} className="block w-full rounded-md border border-input bg-transparent p-3" /></label>
                </>}
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => mode === 'view' ? setEditing(false) : setOpen(false)}>Cancel</Button>
                    <Submit deleting={deleting} />
                </div>
            </form> : details ? <div className="grid gap-6">
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div><dt className="text-muted-foreground">Name</dt><dd>{details.program.name}</dd></div>
                    <div><dt className="text-muted-foreground">ID</dt><dd>{details.program.id}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-muted-foreground">Description</dt><dd className="whitespace-pre-wrap break-words">{details.program.description || '—'}</dd></div>
                    <div><dt className="text-muted-foreground">Created (UTC)</dt><dd>{details.program.createdAt}</dd></div>
                    <div><dt className="text-muted-foreground">Updated (UTC)</dt><dd>{details.program.updatedAt}</dd></div>
                </dl>
                <RecordList title="Participations" records={details.participations.map(p => `${p.name} · ${name(details.schools, p.schoolId)} · ${p.status}\n${p.startDate} – ${p.endDate ?? 'No end date'}`)} />
                <RecordList title="Employee assignments" records={details.assignments.map(a => `${name(details.employees, a.employeeId)} · ${a.role.replaceAll('_', ' ')}${a.region ? ` · Region ${a.region}` : ''}${a.branchId ? ` · Branch #${a.branchId}` : ''}`)} />
                <RecordList title="Municipal sponsors" records={details.municipalities.map(m => `${m.name} · Mayor: ${m.mayor}`)} />
                <RecordList title="Contact history" records={details.interactions.map(i => `${i.contactedAt} · ${name(details.employees, i.employeeId)} → ${name(details.contacts, i.contactId)} · ${i.mode.replaceAll('_', ' ')}${i.schoolId ? ` · ${name(details.schools, i.schoolId)}` : ''}`)} />
                <div className="flex justify-end border-t pt-4"><Button onClick={() => setEditing(true)}>Edit</Button></div>
            </div> : error ? <Button variant="outline" onClick={() => setRevision(r => r + 1)}>Try again</Button> : <p role="status">Loading program details…</p>}
        </DialogContent>
    </Dialog>
}
