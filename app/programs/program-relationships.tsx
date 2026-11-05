'use client'
import { RecordLink } from '@/components/records/record-link'
import { useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SchoolParticipationForm } from '@/app/schools/edit-school-form'
import { deleteSchoolParticipation } from '@/app/schools/actions_schools'
import { recordContactInteraction } from '@/app/contacts/actions_contacts'
import { datedParticipations } from '@/lib/participation-status'
import { useParticipationTime } from '@/app/schools/use-participation-time'
import { changeProgramRelationship, type getProgramDetails } from './actions'

type Details = Awaited<ReturnType<typeof getProgramDetails>>
type Result = { success: true } | { error: string }
function PendingFields({ children }: { children: ReactNode }) {
    const { pending } = useFormStatus()
    return <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">{children}</fieldset>
}
function Submit({ label }: { label: string }) {
    const { pending } = useFormStatus()
    return <Button type="submit" disabled={pending}>{pending ? 'Saving…' : label}</Button>
}
function Action({ children, onSaved, label, action = changeProgramRelationship }: { children: ReactNode; onSaved: () => Promise<void>; label: string; action?: (data: FormData) => Promise<Result> }) {
    const [message, setMessage] = useState('')
    return <form className="grid gap-3 rounded-lg border p-4" action={async data => {
        setMessage('')
        try {
            const result = await action(data)
            if ('error' in result) setMessage(result.error)
            else { await onSaved(); setMessage('Changes saved.') }
        } catch { setMessage('Could not save changes. Check your connection and try again.') }
    }}><PendingFields>{children}<div className="sm:col-span-2"><Submit label={label} /></div></PendingFields>{message && <p role={message === 'Changes saved.' ? 'status' : 'alert'}>{message}</p>}</form>
}
function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
    return <details className="rounded-lg border"><summary className="cursor-pointer p-4 font-semibold">{title} ({count})</summary><div className="grid gap-4 border-t p-4">{children}</div></details>
}
function Select({ name, label, options, value = '', optional = false }: { name: string; label: string; options: { id: number | string; name: string }[]; value?: string; optional?: boolean }) {
    return <label>{label}<select name={name} required={!optional} defaultValue={value} className="block w-full rounded-md border bg-transparent p-2"><option value="" disabled={!optional}>{optional ? 'None' : `Choose ${label.toLowerCase()}`}</option>{options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
}
export function ProgramRelationships({ data, onSaved }: { data: Details; onSaved: () => Promise<void> }) {
    const now = useParticipationTime(data.asOf)
    const participations = datedParticipations(data.participations, now)
    const name = (items: {id: number; name: string}[], id: number | null) => id === null ? 'Unassigned / deleted' : items.find(i => i.id === id)?.name ?? `#${id}`
    return <div className="grid gap-6">
        <Section title="Participations" count={participations.length}>
            <section className="grid gap-3 rounded-lg border bg-muted/20 p-4">
                <h3 className="font-semibold">Existing participations</h3>
                {participations.map(p => <details key={p.id} className="rounded border bg-background"><summary className="cursor-pointer p-3">{p.name} · <RecordLink type="schools" id={p.schoolId}>{name(data.schools, p.schoolId)}</RecordLink> · {p.status}</summary><div className="grid gap-3 border-t p-4">
                    <SchoolParticipationForm schoolId={p.schoolId ?? undefined} schools={data.schools} programs={[data.program]} fixedProgramId={data.program.id} employees={data.employees} onSaved={onSaved} participation={{ ...p, employees: data.participants.filter(a => a.participationId === p.id).flatMap(a => {
                        const employee = data.employees.find(e => e.id === a.employeeId)
                        return employee ? [{ ...employee, role: '' }] : []
                    }) }} />
                    <Action action={deleteSchoolParticipation} label="Delete participation" onSaved={onSaved}>
                        <input type="hidden" name="school-id" value={p.schoolId ?? ""} /><input type="hidden" name="participation-id" value={p.id} />
                        <label className="sm:col-span-2">Type delete to confirm removal of this participation and its employee links<Input required pattern="delete" name="confirmation" /></label>
                    </Action>
                </div></details>)}
                {!participations.length && <p>No participations yet.</p>}
            </section>
            <section className="grid gap-3 rounded-lg border p-4"><h3 className="font-semibold">Add participation</h3>
                {data.schools.length ? <SchoolParticipationForm schools={data.schools} programs={[data.program]} fixedProgramId={data.program.id} employees={data.employees} onSaved={onSaved} /> : <p>Add a school first.</p>}
            </section>
        </Section>
        <Section title="Employee assignments" count={data.assignments.length}>
            {data.assignments.map(a => <section key={a.id} className="grid gap-3 rounded-lg border bg-muted/20 p-4"><h3 className="font-semibold"><RecordLink type="employees" id={a.employeeId}>{name(data.employees, a.employeeId)}</RecordLink></h3>
                <Assignment data={data} assignment={a} onSaved={onSaved} />
                <Action label="Remove assignment" onSaved={onSaved}><input type="hidden" name="operation" value="remove-assignment" /><input type="hidden" name="program-id" value={data.program.id} /><input type="hidden" name="assignment-id" value={a.id} /></Action>
            </section>)}
            {!data.assignments.length && <p>No employee assignments.</p>}
            <section className="grid gap-3 rounded-lg border p-4"><h3 className="font-semibold">Add employee assignment</h3><Assignment data={data} onSaved={onSaved} /></section>
        </Section>
        <Section title="Municipal sponsors" count={data.municipalities.length}>
            <section className="grid gap-3 rounded-lg border bg-muted/20 p-4">
                {data.municipalities.map(m => <div key={m.id}><h3 className="font-semibold"><RecordLink type="municipalities" id={m.id}>{m.name}</RecordLink> · Mayor: {m.mayor}</h3><Action label="Remove sponsorship" onSaved={onSaved}><input type="hidden" name="operation" value="remove-sponsor" /><input type="hidden" name="program-id" value={data.program.id} /><input type="hidden" name="municipality-id" value={m.id} /></Action></div>)}
                {!data.municipalities.length && <p>No sponsors assigned.</p>}
            </section>
            <section className="grid gap-3 rounded-lg border p-4"><h3 className="font-semibold">Add municipal sponsor</h3>
                {data.availableMunicipalities.length ? <Action label="Add sponsor" onSaved={onSaved}><input type="hidden" name="operation" value="add-sponsor" /><input type="hidden" name="program-id" value={data.program.id} /><Select name="municipality-id" label="Municipality" options={data.availableMunicipalities} /></Action> : <p>No additional municipalities available.</p>}
            </section>
        </Section>
        <Section title="Contact history" count={data.interactions.length}>
            <section className="grid gap-3 rounded-lg border bg-muted/20 p-4">{data.interactions.map(i => <p key={i.id}>{i.contactedAt} · <RecordLink type="employees" id={i.employeeId}>{name(data.employees, i.employeeId)}</RecordLink> → <RecordLink type="contacts" id={i.contactId}>{name(data.contacts, i.contactId)}</RecordLink> · {i.mode.replaceAll('_', ' ')}</p>)}{!data.interactions.length && <p>No interactions recorded.</p>}</section>
            <section className="grid gap-3 rounded-lg border p-4"><h3 className="font-semibold">Record a new interaction</h3>
                <Action label="Record interaction" onSaved={onSaved} action={async form => {
                    const date = new Date(String(form.get('contacted-at-local') ?? ''))
                    if (!Number.isFinite(date.getTime())) return { error: 'Enter a valid contact date.' }
                    form.set('contacted-at', date.toISOString())
                    return recordContactInteraction(form)
                }}>
                    <input type="hidden" name="program-id" value={data.program.id} />
                    <Select name="employee-id" label="Employee" options={data.employees} /><Select name="contact-id" label="Contact" options={data.contacts} />
                    <Select name="mode" label="Communication" options={data.modes.map(m => ({ id: m, name: m.replaceAll('_', ' ') }))} />
                    <label>Date and time (local)<Input type="datetime-local" name="contacted-at-local" required /></label>
                    <p className="text-sm text-muted-foreground sm:col-span-2">The contact’s current school is recorded automatically, if assigned.</p>
                </Action>
            </section>
        </Section>
    </div>
}
function Assignment({ data, assignment, onSaved }: { data: Details; assignment?: Details['assignments'][number]; onSaved: () => Promise<void> }) {
    return <Action label={assignment ? 'Save assignment' : 'Add employee'} onSaved={onSaved}>
        <input type="hidden" name="operation" value={assignment ? 'edit-assignment' : 'add-assignment'} /><input type="hidden" name="program-id" value={data.program.id} />
        {assignment && <input type="hidden" name="assignment-id" value={assignment.id} />}
        <Select name="employee-id" label="Employee" options={data.employees} value={assignment ? String(assignment.employeeId) : ''} />
        <Select name="role" label="Role" options={data.roles.map(r => ({ id: r, name: r.replaceAll('_', ' ') }))} value={assignment?.role} />
        <Select name="branch-id" label="Branch (optional)" optional options={data.branches} value={assignment?.branchId ? String(assignment.branchId) : ''} />
        <Select name="region" label="Region (optional)" optional options={data.regions.map(r => ({ id: r, name: r }))} value={assignment?.region ?? ''} />
    </Action>
}
