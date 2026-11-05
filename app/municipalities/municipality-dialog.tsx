'use client'
import { useEffect, useId, useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { Eye, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { saveMunicipality, deleteMunicipality, getMunicipalityDetails, changeMunicipalityProgram } from './actions'

type Municipality = { id: number; name: string; mayor: string }
type Details = Awaited<ReturnType<typeof getMunicipalityDetails>>
type Result = { success: true } | { error: string }
function Fields({ children }: { children: ReactNode }) {
    const { pending } = useFormStatus()
    return <fieldset disabled={pending} className="grid gap-3">{children}</fieldset>
}
function Submit({ label, destructive }: { label: string; destructive?: boolean }) {
    const { pending } = useFormStatus()
    return <Button type="submit" disabled={pending} variant={destructive ? 'destructive' : 'default'}>{pending ? 'Saving…' : label}</Button>
}
function ActionForm({ action, onSaved, label, destructive, children }: { action: (form: FormData) => Promise<Result>; onSaved: () => Promise<void> | void; label: string; destructive?: boolean; children: ReactNode }) {
    const [message, setMessage] = useState('')
    return <form className="grid gap-3" action={async form => {
        setMessage('')
        try {
            const result = await action(form)
            if ('error' in result) setMessage(result.error)
            else { await onSaved(); setMessage('Changes saved.') }
        } catch { setMessage('Could not save changes. Check your connection and try again.') }
    }}>
        <Fields>{children}<div><Submit label={label} destructive={destructive} /></div></Fields>
        {message && <p role={message === 'Changes saved.' ? 'status' : 'alert'}>{message}</p>}
    </form>
}

export function MunicipalityDialog({ municipality, mode = 'create' }: { municipality?: Municipality; mode?: 'create' | 'view' | 'delete' }) {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState(false)
    const [details, setDetails] = useState<Details | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [revision, setRevision] = useState(0)
    const prefix = useId()
    useEffect(() => {
        if (!open || mode !== 'view' || !municipality) return
        let active = true
        setLoading(true)
        setError('')
        getMunicipalityDetails(municipality.id, editing).then(data => { if (active) setDetails(data) })
            .catch(() => { if (active) setError('Could not load municipality details.') })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [open, municipality, editing, mode, revision])
    const current = details?.municipality ?? municipality
    const deleting = mode === 'delete'
    async function refresh() { if (current) setDetails(await getMunicipalityDetails(current.id, editing)) }
    const title = mode === 'create' ? 'Add a Municipality' : deleting ? `Delete ${current?.name}` : editing ? `Edit ${current?.name}` : current?.name ?? 'Municipality details'
    return <Dialog open={open} onOpenChange={value => { setOpen(value); if (!value) { setEditing(false); setDetails(null) } }}>
        <DialogTrigger render={<Button className={mode === 'create' ? 'w-full' : undefined} variant={deleting ? 'destructive' : mode === 'view' ? 'outline' : 'default'} aria-label={mode === 'view' ? `View details for ${municipality?.name}` : title} />}>
            {mode === 'create' ? title : deleting ? <><Trash /> Delete</> : <><Eye /> View details</>}
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[min(90vw,80rem)]">
            <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{deleting ? 'Remove program sponsorship links before deleting this municipality.' : editing ? 'Edit municipality information and sponsored programs.' : 'Municipality information and program sponsorships.'}</DialogDescription></DialogHeader>
            {error && <div role="alert">{error} <Button variant="outline" onClick={() => setRevision(r => r + 1)}>Try again</Button></div>}
            {loading ? <p role="status">Loading {editing ? 'editing options' : 'municipality details'}…</p> : <>
                {mode === 'create' || deleting || editing ? <>
                    {editing && <Button className="w-fit" variant="outline" onClick={() => setEditing(false)}>Back to details</Button>}
                    <div className="rounded-lg border p-4"><ActionForm action={deleting ? deleteMunicipality : saveMunicipality} label={deleting ? 'Delete municipality' : 'Save municipality'} destructive={deleting} onSaved={mode === 'view' ? refresh : () => setOpen(false)}>
                        {current && <input type="hidden" name="id" value={current.id} />}
                        {deleting ? <label htmlFor={`${prefix}-confirm`}>Type delete to confirm<Input id={`${prefix}-confirm`} name="confirmation" pattern="delete" required autoComplete="off" /></label> : <>
                            <label htmlFor={`${prefix}-name`}>Name<Input id={`${prefix}-name`} name="name" required defaultValue={current?.name ?? ''} /></label>
                            <label htmlFor={`${prefix}-mayor`}>Mayor<Input id={`${prefix}-mayor`} name="mayor" required defaultValue={current?.mayor ?? ''} /></label>
                        </>}
                    </ActionForm></div>
                </> : details && <dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Name</dt><dd>{details.municipality.name}</dd></div><div><dt className="text-sm text-muted-foreground">Mayor</dt><dd>{details.municipality.mayor}</dd></div></dl>}
                {mode === 'view' && details && <>
                    <details className="rounded-lg border" open>
                        <summary className="cursor-pointer p-4 font-semibold">Sponsored programs ({details.programs.length})</summary>
                        <div className="grid gap-4 border-t p-4">
                            <div className="rounded-lg border bg-muted/20 p-4"><Table>
                                <TableHeader><TableRow><TableHead>Program</TableHead><TableHead>Description</TableHead>{editing && <TableHead>Actions</TableHead>}</TableRow></TableHeader>
                                <TableBody>{details.programs.map(program => <TableRow key={program.id}><TableCell>{program.name}</TableCell><TableCell className="whitespace-normal">{program.description || '—'}</TableCell>{editing && <TableCell>
                                    <ActionForm action={changeMunicipalityProgram} label="Remove sponsorship" onSaved={refresh}>
                                        <input type="hidden" name="municipality-id" value={details.municipality.id} /><input type="hidden" name="program-id" value={program.id} /><input type="hidden" name="operation" value="remove" />
                                    </ActionForm>
                                </TableCell>}</TableRow>)}{!details.programs.length && <TableRow><TableCell colSpan={editing ? 3 : 2}>No sponsored programs.</TableCell></TableRow>}</TableBody>
                            </Table></div>
                            {editing && <section className="grid gap-3 rounded-lg border p-4"><h3 className="font-semibold">Add sponsored program</h3>
                                {details.availablePrograms.length ? <ActionForm action={changeMunicipalityProgram} label="Add sponsorship" onSaved={refresh}>
                                    <input type="hidden" name="municipality-id" value={details.municipality.id} /><input type="hidden" name="operation" value="add" />
                                    <label>Program<select className="block w-full rounded-md border border-input bg-transparent p-2" name="program-id" required defaultValue=""><option value="" disabled>Choose a program</option>{details.availablePrograms.map(program => <option value={program.id} key={program.id}>{program.name}</option>)}</select></label>
                                </ActionForm> : <p>No additional programs available. Create programs on the Programs page.</p>}
                                <p className="text-sm text-muted-foreground">Removing a sponsorship keeps the program and its participations.</p>
                            </section>}
                        </div>
                    </details>
                    {!editing && <div className="flex justify-end border-t pt-4"><Button onClick={() => setEditing(true)}>Edit</Button></div>}
                </>}
            </>}
        </DialogContent>
    </Dialog>
}
