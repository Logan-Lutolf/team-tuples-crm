'use client'
import { sortHistoryByDate } from '@/lib/history-date-sort'
import { HistoryDateSort, type HistoryDateOrder, type HistoryDateField } from '@/components/records/history-date-sort'
import { RecordLink } from '@/components/records/record-link'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ContactActionForm } from './contact-action-form'
import { addContactEmployment, editContactEmployment, deleteContactEmployment } from '../employment-actions'
import type { getContactDetails } from '../actions_contacts'

type Details = Awaited<ReturnType<typeof getContactDetails>>
type Employment = Details['employmentHistory'][number]
function EmploymentForm({ contactId, schools, record, onSaved }: {
    contactId: number; schools: Details['schools']; record?: Employment; onSaved: () => Promise<void>
}) {
    const prefix = useId()
    return <ContactActionForm className="grid gap-3 sm:grid-cols-2" action={async form => {
        const result = await (record ? editContactEmployment : addContactEmployment)(form)
        if ('success' in result) await onSaved()
        return result
    }}>
        <input type="hidden" name="contact-id" value={contactId} />
        {record && <input type="hidden" name="employment-id" value={record.id} />}
        <label htmlFor={`${prefix}-school`}>School<select id={`${prefix}-school`} name="school-id" required={!record} defaultValue={record?.schoolId ? String(record.schoolId) : ''} className="block w-full rounded-md border bg-transparent p-2">
            <option value="" disabled={!record}>No school assigned</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select></label>
        <label htmlFor={`${prefix}-title`}>Job title<Input id={`${prefix}-title`} name="job-title" required defaultValue={record?.jobTitle ?? ''} /></label>
        <label htmlFor={`${prefix}-start`}>Start date<Input id={`${prefix}-start`} name="start-date" type="date" required defaultValue={record?.startDate.slice(0, 10) ?? ''} /></label>
        <label htmlFor={`${prefix}-end`}>End date (optional)<Input id={`${prefix}-end`} name="end-date" type="date" defaultValue={record?.endDate?.slice(0, 10) ?? ''} /></label>
        <label htmlFor={`${prefix}-notes`} className="sm:col-span-2">Notes (optional)<textarea id={`${prefix}-notes`} name="notes" rows={3} defaultValue={record?.notes ?? ''} className="block w-full rounded-md border bg-transparent p-3" /></label>
        <p className="text-sm text-muted-foreground sm:col-span-2">Leave the end date empty for ongoing employment. Multiple school appointments may overlap. This does not change the contact’s primary school.</p>
        <Button type="submit" className="sm:col-span-2">{record ? 'Save employment' : 'Add employment'}</Button>
    </ContactActionForm>
}
function EmploymentRecord({ record, data, editing, onSaved }: { record: Employment; data: Details; editing: boolean; onSaved: () => Promise<void> }) {
    const [edit, setEdit] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const prefix = useId()
    return <article className="grid gap-3 rounded-lg border bg-muted/20 p-4">
        <h3 className="font-semibold"><RecordLink type="schools" id={record.schoolId}>{data.schools.find(s => s.id === record.schoolId)?.name ?? (record.schoolId === null ? 'School deleted' : `School #${record.schoolId}`)}</RecordLink> · {record.jobTitle}</h3>
        <p>{record.startDate.slice(0, 10)} – {record.endDate?.slice(0, 10) ?? 'No end date'}</p>
        {record.notes && <p className="whitespace-pre-wrap break-words">{record.notes}</p>}
        {editing && <>
            <div className="flex gap-3"><Button type="button" variant="outline" aria-expanded={edit} onClick={() => { setEdit(!edit); setDeleting(false) }}>{edit ? 'Cancel edit' : 'Edit employment'}</Button><Button type="button" variant="destructive" aria-expanded={deleting} onClick={() => { setDeleting(!deleting); setEdit(false) }}>{deleting ? 'Cancel deletion' : 'Delete'}</Button></div>
            {edit && <EmploymentForm contactId={data.contact.id} schools={data.schools} record={record} onSaved={async () => { await onSaved(); setEdit(false) }} />}
            {deleting && <ContactActionForm className="grid gap-3 rounded-lg border p-4" action={async form => {
                const result = await deleteContactEmployment(form)
                if ('success' in result) await onSaved()
                return result
            }}>
                <input type="hidden" name="contact-id" value={data.contact.id} /><input type="hidden" name="employment-id" value={record.id} />
                <label htmlFor={`${prefix}-confirm`}>Type delete to remove this employment record<Input id={`${prefix}-confirm`} name="confirmation" required pattern="delete" autoComplete="off" /></label>
                <Button type="submit" variant="destructive">Delete employment</Button>
            </ContactActionForm>}
        </>}
    </article>
}
export function ContactEmploymentHistory({ data, editing, onSaved }: { data: Details; editing: boolean; onSaved: () => Promise<void> }) {
    const [dateField, setDateField] = useState<HistoryDateField>('startDate')
    const [dateOrder, setDateOrder] = useState<HistoryDateOrder>('newest')
    const records = sortHistoryByDate(data.employmentHistory, dateField, dateOrder)
    return <details className="rounded-lg border"><summary className="cursor-pointer p-4 font-semibold">Employment history ({data.employmentHistory.length})</summary><div className="grid gap-4 border-t p-4">
        <HistoryDateSort field={dateField} onFieldChange={setDateField} value={dateOrder} onChange={setDateOrder} />
        {records.map(record => <EmploymentRecord key={record.id} record={record} data={data} editing={editing} onSaved={onSaved} />)}
        {!data.employmentHistory.length && <p>No employment history recorded. A primary school association does not record employment dates.</p>}
        {editing && <section className="grid gap-3 rounded-lg border p-4"><h3 className="font-semibold">Add employment</h3>
            {data.schools.length ? <EmploymentForm contactId={data.contact.id} schools={data.schools} onSaved={onSaved} /> : <p>Add a school before recording employment.</p>}
        </section>}
    </div></details>
}
