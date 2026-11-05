'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RecordLink } from '@/components/records/record-link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ContactActionForm } from './forms/contact-action-form'
import { changeContactParticipation } from './participation-actions'
import { datedParticipations } from '@/lib/participation-status'
import { useParticipationTime } from '@/app/schools/use-participation-time'
import type { getContactDetails } from './actions_contacts'

type Details = Awaited<ReturnType<typeof getContactDetails>>
export function ContactParticipations({ data, editing, onSaved }: { data: Details; editing: boolean; onSaved: () => Promise<void> }) {
    const [changing, setChanging] = useState<number | null>(null)
    const [removing, setRemoving] = useState<number | null>(null)
    const now = useParticipationTime(data.asOf)
    const rows = datedParticipations(data.participations, now)
    const name = (items: { id: number; name: string }[], id: number | null) => id === null ? 'Unassigned / deleted' : items.find(i => i.id === id)?.name ?? `#${id}`
    const label = (p: Details['participationOptions'][number]) => `${name(data.programs, p.programId)} · ${p.name} · ${name(data.schools, p.schoolId)} · ${p.startDate.slice(0, 10)} (#${p.id})`
    const available = data.participationOptions.filter(p => !rows.some(r => r.id === p.id))
    async function save(form: FormData) {
        const result = await changeContactParticipation(form)
        if ('success' in result) { await onSaved(); setChanging(null); setRemoving(null) }
        return result
    }
    return <details className="rounded-lg border"><summary className="cursor-pointer p-4 font-semibold">Program participations ({rows.length})</summary><div className="grid gap-4 border-t p-4">
        <section className="grid gap-3 rounded-lg border bg-muted/20 p-4"><h3 className="font-semibold">Recorded participations</h3>
            <Table><TableHeader><TableRow><TableHead>Program</TableHead><TableHead>Participation</TableHead><TableHead>School</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead>{editing && <TableHead>Actions</TableHead>}</TableRow></TableHeader>
                <TableBody>{rows.map(p => <TableRow key={p.id}>
                    <TableCell><RecordLink type="programs" id={p.programId}>{name(data.programs, p.programId)}</RecordLink></TableCell><TableCell>{p.name}</TableCell><TableCell><RecordLink type="schools" id={p.schoolId}>{name(data.schools, p.schoolId)}</RecordLink></TableCell>
                    <TableCell>{p.startDate.replace('T', ' ').slice(0, 16)} UTC</TableCell><TableCell>{p.endDate ? `${p.endDate.replace('T', ' ').slice(0, 16)} UTC` : '—'}</TableCell><TableCell>{p.status}</TableCell>
                    {editing && <TableCell><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => { setChanging(changing === p.id ? null : p.id); setRemoving(null) }}>Change participation</Button><Button type="button" variant="destructive" onClick={() => { setRemoving(removing === p.id ? null : p.id); setChanging(null) }}>Remove link</Button></div></TableCell>}
                </TableRow>)}{!rows.length && <TableRow><TableCell colSpan={editing ? 7 : 6}>No recorded program participations.</TableCell></TableRow>}</TableBody>
            </Table>
        </section>
        {editing && changing !== null && <section className="grid gap-3 rounded-lg border p-4"><h3 className="font-semibold">Change linked participation</h3><ContactActionForm action={save} className="grid gap-3">
            <input type="hidden" name="contact-id" value={data.contact.id} /><input type="hidden" name="operation" value="change" /><input type="hidden" name="previous-participation-id" value={changing} />
            <label>Participation<select key={changing} name="participation-id" defaultValue={changing} required className="block w-full rounded-md border bg-transparent p-2">{data.participationOptions.filter(p => p.id === changing || available.some(a => a.id === p.id)).map(p => <option key={p.id} value={p.id}>{label(p)}</option>)}</select></label>
            <Button type="submit">Save participation link</Button>
        </ContactActionForm></section>}
        {editing && removing !== null && <ContactActionForm action={save} className="grid gap-3 rounded-lg border p-4">
            <p>Remove this contact’s participation link? The participation and other attendees will remain.</p>
            <input type="hidden" name="contact-id" value={data.contact.id} /><input type="hidden" name="participation-id" value={removing} /><input type="hidden" name="operation" value="remove" />
            <div className="flex gap-2"><Button type="submit" variant="destructive">Confirm removal</Button><Button type="button" variant="outline" onClick={() => setRemoving(null)}>Cancel</Button></div>
        </ContactActionForm>}
        {editing && <section className="grid gap-3 rounded-lg border p-4"><h3 className="font-semibold">Add program participation</h3><p className="text-sm text-muted-foreground">Choose the specific program occurrence this teacher attended. This does not change their primary school or employment history.</p>
            {available.length ? <ContactActionForm action={save} className="grid gap-3"><input type="hidden" name="contact-id" value={data.contact.id} /><input type="hidden" name="operation" value="add" />
                <label>Participation<select name="participation-id" required defaultValue="" className="block w-full rounded-md border bg-transparent p-2"><option value="" disabled>Choose participation</option>{available.map(p => <option key={p.id} value={p.id}>{label(p)}</option>)}</select></label>
                <Button type="submit">Add participation</Button>
            </ContactActionForm> : <p>No additional participations available. Create a participation on the Schools or Programs page first.</p>}
        </section>}
    </div></details>
}
