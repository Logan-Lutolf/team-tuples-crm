'use client'
import { EditHistoryButton } from '@/components/records/edit-history-button'
import { PageContent, PageHeader, PageTitle, PageDescription } from '@/components/records/page-content'
import { RecordLink } from '@/components/records/record-link'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { editBranch, getBranchDetails, updateBranchRelationship } from './actions'
import type { BranchResult } from './branch-data'

type Details = Awaited<ReturnType<typeof getBranchDetails>>
type Assignment = Details['assignments'][number]
const selectClass = 'block w-full rounded-md border border-input bg-transparent p-2'

function PendingFields({ children }: { children: ReactNode }) {
    const { pending } = useFormStatus()
    return <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">{children}</fieldset>
}
function SaveButton({ label }: { label: string }) {
    const { pending } = useFormStatus()
    return <Button type="submit" disabled={pending}>{pending ? 'Saving…' : label}</Button>
}
function ActionForm({ action = updateBranchRelationship, onSaved, children, label = 'Save changes' }: {
    action?: (form: FormData) => Promise<BranchResult>; onSaved: () => Promise<void>; children: ReactNode; label?: string
}) {
    const [message, setMessage] = useState('')
    return <form className="grid gap-3 rounded-lg border p-4" action={async form => {
        setMessage('')
        try {
            const result = await action(form)
            if ('error' in result) setMessage(result.error)
            else { await onSaved(); setMessage('Changes saved.') }
        } catch { setMessage('Could not save changes. Check your connection and try again.') }
    }}>
        <PendingFields>{children}<div className="sm:col-span-2"><SaveButton label={label} /></div></PendingFields>
        {message && <p role={message === 'Changes saved.' ? 'status' : 'alert'}>{message}</p>}
    </form>
}
function Options({ name, label, values, value = '', optional = false }: {
    name: string; label: string; values: { value: string; label: string }[]; value?: string; optional?: boolean
}) {
    return <label>{label}<select className={selectClass} name={name} defaultValue={value} required={!optional}>
        <option value="" disabled={!optional}>{optional ? 'None' : `Choose ${label.toLowerCase()}`}</option>
        {values.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
    </select></label>
}
function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
    return <details className="rounded-lg border"><summary className="cursor-pointer p-4 font-semibold">{title} ({count})</summary><div className="grid gap-4 border-t p-4">{children}</div></details>
}
function AssignmentForm({ details, assignment, onSaved }: { details: Details; assignment?: Assignment; onSaved: () => Promise<void> }) {
    return <ActionForm onSaved={onSaved} label={assignment ? 'Save assignment' : 'Add employee'}>
        <input type="hidden" name="operation" value={assignment ? 'edit-assignment' : 'add-assignment'} />
        <input type="hidden" name="branch-id" value={details.branch.id} />
        {assignment && <input type="hidden" name="assignment-id" value={assignment.id} />}
        <Options name="employee-id" label="Employee" values={details.employees.map(e => ({ value: String(e.id), label: `${e.name} (${e.email})` }))} value={assignment ? String(assignment.employeeId) : ''} />
        <Options name="role" label="Role" values={details.roles.map(role => ({ value: role, label: role.replaceAll('_', ' ') }))} value={assignment?.role} />
        <Options name="program-id" label="Program (optional)" optional values={details.programs.map(p => ({ value: String(p.id), label: p.name }))} value={assignment?.programId ? String(assignment.programId) : ''} />
        <Options name="region" label="Region (optional)" optional values={details.regions.map(value => ({ value, label: value }))} value={assignment?.region ?? ''} />
    </ActionForm>
}

export function BranchDetailsPage({ branchId, branchName, initialDetails }: { branchId: number; branchName: string; initialDetails?: Details }) {
    const [editing, setEditing] = useState(false)
    const [details, setDetails] = useState<Details | null>(initialDetails ?? null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [revision, setRevision] = useState(0)
    const prefix = useId()
    useEffect(() => {
        if (initialDetails && revision === 0 && !editing) return
        let active = true
        setLoading(true)
        setError('')
        getBranchDetails(branchId, editing).then(data => { if (active) setDetails(data) })
            .catch(() => { if (active) setError('Could not load branch details. Try again.') })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [branchId, editing, revision, initialDetails])
    async function refresh() { setDetails(await getBranchDetails(branchId, editing)) }
    const branch = details?.branch
    return <PageContent backHref="/branches">

            <PageHeader><PageTitle>{editing ? `Edit branch ${branch?.name ?? branchName}` : `Branch ${branch?.name ?? branchName}`}</PageTitle><PageDescription>{editing ? 'Update branch information, contacts, and employee assignments.' : 'Branch information and related records.'}</PageDescription></PageHeader>
            {error && <div role="alert">{error} <Button variant="outline" onClick={() => setRevision(r => r + 1)}>Try again</Button></div>}
            {loading ? <p role="status">Loading {editing ? 'editing options' : 'branch details'}…</p> : details && branch && <div className="grid gap-6">
                {editing ? <>
                    <Button variant="outline" className="w-fit" onClick={() => setEditing(false)}>Back to details</Button>
                    <ActionForm action={editBranch} onSaved={refresh} label="Save branch">
                        <input type="hidden" name="id" value={branch.id} />
                        <Options name="name" label="Name" values={details.names.map(value => ({ value, label: value }))} value={branch.name} />
                        <Options name="region" label="Region" values={details.regions.map(value => ({ value, label: value }))} value={branch.region} />
                        <label>Institute (optional)<Input name="institute" defaultValue={branch.institute ?? ''} /></label>
                        <Options name="chiefId" label="Chief (optional)" optional values={details.employees.map(e => ({ value: String(e.id), label: `${e.name} (${e.email})` }))} value={branch.chiefId ? String(branch.chiefId) : ''} />
                    </ActionForm>
                </> : <dl className="grid gap-4 sm:grid-cols-2">
                    {Object.entries({ Name: branch.name, Region: branch.region, Institute: branch.institute || '—', Chief: details.employees.find(e => e.id === branch.chiefId)?.name ?? 'Unassigned' }).map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd>{label === 'Chief' ? <RecordLink type="employees" id={branch.chiefId}>{value}</RecordLink> : value}</dd></div>)}
                </dl>}
                <Section title="Contacts" count={details.contacts.length}>
                    <div className="rounded-lg border bg-muted/20 p-4">
                        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Role</TableHead></TableRow></TableHeader>
                        <TableBody>{details.contacts.map(c => <TableRow key={c.id}><TableCell><RecordLink type="contacts" id={c.id}>{c.name}</RecordLink></TableCell><TableCell><a href={`mailto:${c.email}`}>{c.email}</a></TableCell><TableCell>{c.phone || '—'}</TableCell><TableCell>{c.contactRole.replaceAll('_', ' ')}</TableCell></TableRow>)}
                        {!details.contacts.length && <TableRow><TableCell colSpan={4}>No contacts assigned to this branch.</TableCell></TableRow>}</TableBody></Table>
                    </div>
                    {editing && <>
                        {details.contacts.map(c => <div className="grid gap-3" key={c.id}>
                            <h4 className="font-semibold"><RecordLink type="contacts" id={c.id}>{c.name}</RecordLink></h4>
                            <ActionForm onSaved={refresh} label="Save contact">
                                <input type="hidden" name="operation" value="edit-contact" /><input type="hidden" name="branch-id" value={branch.id} /><input type="hidden" name="contact-id" value={c.id} />
                                <label>Name<Input name="name" required defaultValue={c.name} /></label><label>Email<Input name="email" type="email" required defaultValue={c.email} /></label><label>Phone<Input name="phone" defaultValue={c.phone ?? ''} /></label>
                                <Options name="contactRole" label="Contact role" value={c.contactRole} values={details.contactRoles.map(value => ({ value, label: value.replaceAll('_', ' ') }))} />
                            </ActionForm>
                            {details.branches.length > 1 && <ActionForm onSaved={refresh} label="Move contact">
                                <input type="hidden" name="operation" value="move-contact" /><input type="hidden" name="branch-id" value={branch.id} /><input type="hidden" name="contact-id" value={c.id} />
                                <Options name="destination" label="Move to branch" values={details.branches.filter(b => b.id !== branch.id).map(b => ({ value: String(b.id), label: b.name }))} />
                            </ActionForm>}
                        </div>)}
                        <h4 className="font-semibold">Assign an existing contact</h4>
                        <p className="text-sm text-muted-foreground">This changes the contact’s branch. Their school and contact history stay linked.</p>
                        {details.otherContacts.length ? <ActionForm onSaved={refresh} label="Assign contact">
                            <input type="hidden" name="operation" value="assign-contact" /><input type="hidden" name="branch-id" value={branch.id} />
                            <Options name="contact-id" label="Contact" values={details.otherContacts.map(c => ({ value: String(c.id), label: `${c.name} (${c.email})` }))} />
                        </ActionForm> : <p className="text-muted-foreground">No additional contacts available.</p>}
                    </>}
                </Section>
                <Section title="Employee assignments" count={details.assignments.length}>
                    <div className="rounded-lg border bg-muted/20 p-4">
                        <Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Role</TableHead><TableHead>Program</TableHead><TableHead>Region</TableHead></TableRow></TableHeader>
                        <TableBody>{details.assignments.map(a => <TableRow key={a.id}><TableCell><RecordLink type="employees" id={a.employeeId}>{details.employees.find(e => e.id === a.employeeId)?.name ?? `Employee #${a.employeeId}`}</RecordLink></TableCell><TableCell>{a.role.replaceAll('_', ' ')}</TableCell><TableCell><RecordLink type="programs" id={a.programId}>{details.programs.find(p => p.id === a.programId)?.name ?? '—'}</RecordLink></TableCell><TableCell>{a.region || '—'}</TableCell></TableRow>)}
                        {!details.assignments.length && <TableRow><TableCell colSpan={4}>No employees assigned to this branch.</TableCell></TableRow>}</TableBody></Table>
                    </div>
                    {editing && <>
                        {details.assignments.map(a => <div className="grid gap-2" key={a.id}>
                            <AssignmentForm details={details} assignment={a} onSaved={refresh} />
                            <ActionForm onSaved={refresh} label="Remove assignment"><input type="hidden" name="operation" value="remove-assignment" /><input type="hidden" name="branch-id" value={branch.id} /><input type="hidden" name="assignment-id" value={a.id} /></ActionForm>
                        </div>)}
                        <h4 className="font-semibold">Add employee assignment</h4>
                        <AssignmentForm details={details} onSaved={refresh} />
                    </>}
                </Section>
                <Section title="Schools" count={details.schools.length}>
                    <p className="text-sm text-muted-foreground">Relationship status with each school assigned to this branch. Update the status on the school’s edit page.</p>
                    <Table>
                        <TableHeader><TableRow><TableHead>School</TableHead><TableHead>Relationship status</TableHead></TableRow></TableHeader>
                        <TableBody>{details.schools.map(s => <TableRow key={s.id}>
                            <TableCell><RecordLink type="schools" id={s.id}>{s.name}</RecordLink></TableCell>
                            <TableCell>{s.relationship.charAt(0) + s.relationship.slice(1).toLowerCase()}</TableCell>
                        </TableRow>)}{!details.schools.length && <TableRow><TableCell colSpan={2}>No schools assigned.</TableCell></TableRow>}</TableBody>
                    </Table>
                </Section>
                {!editing && <div className="flex flex-wrap justify-end gap-2 border-t pt-4"><EditHistoryButton type="branches" id={branchId} /><Button aria-describedby={`${prefix}-edit-hint`} onClick={() => setEditing(true)}>Edit</Button><span id={`${prefix}-edit-hint`} className="sr-only">Edit this branch, its contacts, and employee assignments</span></div>}
            </div>}
    </PageContent>
}
