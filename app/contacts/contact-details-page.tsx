'use client'
import { SmartEmailingHistory } from '@/components/email/smartemailing-history'
import { useCanEditBranch } from '@/components/records/branch-edit-access'
import { PageActionLink } from '@/components/records/page-action-link'
import { EditHistoryButton } from '@/components/records/edit-history-button'
import { DeferredHistory } from '@/components/records/deferred-history'
import { PageContent, PageHeader, PageTitle, PageDescription } from '@/components/records/page-content'
import { RecordLink } from '@/components/records/record-link'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ContactParticipations } from './contact-participations'
import { ContactEmploymentHistory } from './forms/contact-employment-form'
import { EditContactForm } from './forms/edit-contact'
import { ContactActionForm } from './forms/contact-action-form'
import { getContactDetails, recordContactInteraction } from './actions_contacts'

type Details = Awaited<ReturnType<typeof getContactDetails>>
function name(items: { id: number; name: string }[], id: number | null) { return id === null ? '—' : items.find(i => i.id === id)?.name ?? `#${id}` }
function date(value: string) { return `${new Date(value).toISOString().replace('T', ' ').slice(0, 19)} UTC` }

function ContactHistory({ data, editing, onSaved }: { data: Details; editing: boolean; onSaved: () => Promise<void> }) {
    const [after, setAfter] = useState('')
    const [before, setBefore] = useState('')
    const records = data.interactions.filter(i => (!after || i.contactedAt.slice(0, 10) >= after) && (!before || i.contactedAt.slice(0, 10) <= before))
    return <details className="rounded-lg border">
        <summary className="cursor-pointer p-4 font-semibold">Contact history ({data.interactions.length})</summary>
        <div className="grid gap-4 border-t p-4">
            <section className="grid gap-3 rounded-lg border bg-muted/20 p-4">
                {editing && <><h3 className="font-semibold">Filter history</h3><div className="flex flex-wrap gap-3">
                    <label>From (UTC)<Input type="date" value={after} onChange={e => setAfter(e.target.value)} /></label>
                    <label>Through (UTC)<Input type="date" value={before} onChange={e => setBefore(e.target.value)} /></label>
                </div></>}
                <Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Employee</TableHead><TableHead>School</TableHead><TableHead>Program</TableHead><TableHead>Communication</TableHead></TableRow></TableHeader>
                    <TableBody>{records.map(i => <TableRow key={i.id}><TableCell>{date(i.contactedAt)}</TableCell><TableCell><RecordLink type="employees" id={i.employeeId}>{name(data.employees, i.employeeId)}</RecordLink></TableCell><TableCell><RecordLink type="schools" id={i.schoolId}>{name(data.schools, i.schoolId)}</RecordLink></TableCell><TableCell><RecordLink type="programs" id={i.programId}>{name(data.programs, i.programId)}</RecordLink></TableCell><TableCell>{i.mode.replaceAll('_', ' ')}</TableCell></TableRow>)}
                        {!records.length && <TableRow><TableCell colSpan={5}>No interactions{after || before ? ' in this date range' : ' recorded'}.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </section>
            {editing && <section className="grid gap-3 rounded-lg border p-4">
                <h3 className="font-semibold">Record a new interaction</h3>
                <p className="text-sm text-muted-foreground">Enter when contact was made in your local time. This records the contact’s current school, if assigned.</p>
                {data.employees.length ? <ContactActionForm className="grid gap-3 sm:grid-cols-2" action={async form => {
                    const timestamp = new Date(String(form.get('contacted-at-local') ?? ''))
                    if (!Number.isFinite(timestamp.getTime())) return { error: 'Enter a valid contact date.' }
                    form.set('contacted-at', timestamp.toISOString())
                    const result = await recordContactInteraction(form)
                    if ('success' in result) await onSaved()
                    return result
                }}>
                    <input type="hidden" name="contact-id" value={data.contact.id} />
                    <label>Employee<select className="block w-full rounded-md border p-2" name="employee-id" required defaultValue=""><option value="" disabled>Choose employee</option>{data.employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.email})</option>)}</select></label>
                    <label>Program (optional)<select className="block w-full rounded-md border p-2" name="program-id"><option value="">No program</option>{data.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
                    <label>Communication<select className="block w-full rounded-md border p-2" name="mode" required>{data.modes.map(mode => <option key={mode} value={mode}>{mode.replaceAll('_', ' ')}</option>)}</select></label>
                    <label>Date and time (local)<Input type="datetime-local" name="contacted-at-local" required /></label>
                    <Button type="submit" className="sm:col-span-2">Record interaction</Button>
                </ContactActionForm> : <p className="text-muted-foreground">Add employees on the Employees page before recording interactions.</p>}
            </section>}
        </div>
    </details>
}

export function ContactDetailsPage({ contactId, contactName, initialDetails }: { contactId: number; contactName: string; initialDetails?: Details }) {
    const canEdit = useCanEditBranch(initialDetails?.contact.branchId ?? null)
    const [editing, setEditing] = useState(false)
    const [data, setData] = useState<Details | null>(initialDetails ?? null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [revision, setRevision] = useState(0)
    useEffect(() => {
        if (initialDetails && revision === 0 && !editing) return
        let active = true
        setLoading(true)
        setError('')
        getContactDetails(contactId, editing, true).then(result => { if (active) setData(result) })
            .catch(() => { if (active) setError('Could not load contact details.') })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [contactId, editing, revision, initialDetails])
    async function refresh() { setData(await getContactDetails(contactId, editing, true)) }
    const contact = data?.contact
    return <PageContent backHref="/contacts">

            <PageHeader><PageTitle>{editing ? 'Edit ' : ''}{contact?.name ?? contactName}</PageTitle><PageDescription>{editing ? 'Update contact fields, school relationships, and contact history.' : 'Contact information and related records.'}</PageDescription></PageHeader>
            {error && <div role="alert">{error} <Button variant="outline" onClick={() => setRevision(r => r + 1)}>Try again</Button></div>}
            {loading ? <p role="status">Loading {editing ? 'editing options' : 'contact details'}…</p> : data && contact && <div className="grid gap-6">
                {editing ? <>
                    <Button type="button" className="w-fit" variant="outline" onClick={() => setEditing(false)}>Back to details</Button>
                    <EditContactForm {...contact} branches={data.branches} availableSchools={data.schools} onSaved={refresh} />
                </> : <>
                    <dl className="grid gap-4 sm:grid-cols-2">
                        {Object.entries({ Name: contact.name, Email: contact.email, Phone: contact.phone || '—', Role: contact.contactRole.replaceAll('_', ' '), Region: contact.region || '—', 'Street address': contact.address?.street || '—', City: contact.address?.city || '—', 'Postal code': contact.address?.zipCode || '—', Country: contact.address?.country || '—', Branch: name(data.branches, contact.branchId), Created: date(contact.createdAt), Updated: date(contact.updatedAt) }).map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-words">{label === 'Branch' ? <RecordLink type="branches" id={contact.branchId}>{value}</RecordLink> : value}</dd></div>)}
                        <div><dt className="text-sm text-muted-foreground">Last personal contact</dt><dd>{contact.last_contacted_byId ? date(contact.last_contacted) : 'No recorded contact employee'}</dd></div>
                        <div><dt className="text-sm text-muted-foreground">Last contacted by</dt><dd><RecordLink type="employees" id={contact.last_contacted_byId}>{name(data.employees, contact.last_contacted_byId)}</RecordLink></dd></div>
                    </dl>
                    {data.smartEmailing && <SmartEmailingHistory data={data.smartEmailing} />}
                    <details className="rounded-lg border" open><summary className="cursor-pointer p-4 font-semibold">School</summary><div className="border-t p-4"><div className="rounded-lg border bg-muted/20 p-4">{contact.schoolId ? <RecordLink type="schools" id={contact.schoolId}>{name(data.schools, contact.schoolId)}</RecordLink> : 'No school assigned.'}</div></div></details>
                </>}
                <ContactParticipations data={data} editing={editing} onSaved={refresh} />
                <ContactEmploymentHistory data={data} editing={editing} onSaved={refresh} />
                {editing ? <ContactHistory data={data} editing onSaved={refresh} /> : <DeferredHistory key={contact.updatedAt} type="contacts" id={contactId} />}
                {!editing && <div className="flex flex-wrap justify-end gap-2 border-t pt-4"><PageActionLink href="/email">Email contacts</PageActionLink><EditHistoryButton type="contacts" id={contactId} />{canEdit && <Button type="button" onClick={() => setEditing(true)}>Edit</Button>}</div>}
            </div>}
    </PageContent>
}
