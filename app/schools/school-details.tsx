'use client'
import { useCanEditBranch } from '@/components/records/branch-edit-access'
import { EditHistoryButton } from '@/components/records/edit-history-button'
import { DeferredHistory } from '@/components/records/deferred-history'
import { RecordLink } from '@/components/records/record-link'

import { datedParticipations } from '@/lib/participation-status'
import { useParticipationTime } from './use-participation-time'

import { Fragment, useId, useState, type ComponentProps, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { PageHeader, PageTitle, PageDescription } from '@/components/records/page-content'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getSchoolDetails } from './actions_schools'
import { EditSchoolForm } from './edit-school-form'

type Props = ComponentProps<typeof EditSchoolForm> & { createdAt: string; updatedAt: string; onDetailsRefresh?: () => void }

function Record({ label, children }: { label: string; children: ReactNode }) {
    return <div className="min-w-0"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-words">{children || '—'}</dd></div>
}

function Timestamp({ value }: { value: string | null }) {
    return value ? <time dateTime={value}>{value.replace('T', ' ').slice(0, 19)} UTC</time> : <>—</>
}

export function SchoolDetails(school: Props) {
    const canEdit = useCanEditBranch(school.branchId)
    const now = useParticipationTime(school.participationAsOf)
    const participations = datedParticipations(school.participations, now)
    const [editing, setEditing] = useState(false)
    const [expandedParticipants, setExpandedParticipants] = useState<Set<number>>(new Set())
    const participantsPrefix = useId()
    const [editData, setEditData] = useState<ComponentProps<typeof EditSchoolForm> | null>(null)
    const [loadingEdit, setLoadingEdit] = useState(false)
    const [editError, setEditError] = useState('')
    async function openEdit() {
        setLoadingEdit(true)
        setEditError('')
        try {
            setEditData(await getSchoolDetails(school.id, true))
            setEditing(true)
        } catch { setEditError('Could not load editing options. Try again.') }
        finally { setLoadingEdit(false) }
    }
    const programName = (id: number | null) => id === null ? 'Program deleted' : school.programs.find(p => p.id === id)?.name ?? `Program #${id}`
    return <div className="grid gap-6">
        <PageHeader>
            <PageTitle>{editing ? `Edit ${school.name}` : school.name}</PageTitle>
            <PageDescription>{editing ? 'Update school fields, contacts, participations, and contact history.' : 'School details and related records.'}</PageDescription>
        </PageHeader>
        {editing ? <>
            <Button type="button" variant="outline" className="w-fit" onClick={() => { setEditing(false); school.onDetailsRefresh?.() }}>Back to details</Button>
            <EditSchoolForm {...(editData ?? school)} onRelationshipsChange={async () => { setEditData(await getSchoolDetails(school.id, true)) }} />
        </> : <>
            <section className="grid gap-3" aria-label="School information">
                <h3 className="font-semibold">School information</h3>
                <dl className="grid gap-4 sm:grid-cols-2">
                    <Record label="Name">{school.name}</Record>
                    <Record label="School ID">{school.id}</Record>
                    <Record label="Email"><a href={`mailto:${school.email}`} className="underline">{school.email}</a></Record>
                    <Record label="Phone">{school.phone ? <a href={`tel:${school.phone}`}>{school.phone}</a> : '—'}</Record>
                    <Record label="Street address">{school.address.street}</Record>
                    <Record label="City">{school.address.city}</Record>
                    <Record label="Postal code">{school.address.zipCode}</Record>
                    <Record label="Country">{school.address.country}</Record>
                    <Record label="Type">{school.type}</Record>
                    <Record label="Relationship">{school.relationship}</Record>
                    <Record label="Region">{school.region}</Record>
                    <Record label="Branch"><RecordLink type="branches" id={school.branchId}>{school.branches.find(b => b.id === school.branchId)?.name ?? (school.branchId === null ? 'No branch assigned' : `Branch #${school.branchId}`)}</RecordLink></Record>
                    <Record label="Created"><Timestamp value={school.createdAt} /></Record>
                    <Record label="Updated"><Timestamp value={school.updatedAt} /></Record>
                </dl>
            </section>
            <details className="rounded-lg border" open>
                <summary className="cursor-pointer p-4 font-semibold">School contacts ({school.contacts.length})</summary>
                <div className="grid gap-3 border-t p-4">
                    <Table>
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead></TableRow></TableHeader>
                        <TableBody>{school.contacts.map(c => <TableRow key={c.id}><TableCell><RecordLink type="contacts" id={c.id}>{c.name}</RecordLink></TableCell><TableCell>{c.contactRole.replaceAll('_', ' ')}</TableCell><TableCell><a href={`mailto:${c.email}`}>{c.email}</a></TableCell><TableCell>{c.phone || '—'}</TableCell></TableRow>)}{!school.contacts.length && <TableRow><TableCell colSpan={4}>No contacts assigned.</TableCell></TableRow>}</TableBody>
                    </Table>
                </div>
            </details>
            <details className="rounded-lg border" open>
                <summary className="cursor-pointer p-4 font-semibold">Participations ({participations.length})</summary>
                <div className="grid gap-3 border-t p-4">
                <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Program</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead><TableHead>Employees</TableHead></TableRow></TableHeader>
                    <TableBody>{participations.map(p => <Fragment key={p.id}>
                        <TableRow>
                            <TableCell>{p.name}</TableCell><TableCell><RecordLink type="programs" id={p.programId}>{programName(p.programId)}</RecordLink></TableCell>
                            <TableCell><Timestamp value={p.startDate} /></TableCell><TableCell><Timestamp value={p.endDate} /></TableCell><TableCell>{p.status}</TableCell>
                            <TableCell>
                                <Button type="button" variant="outline" size="sm"
                                    aria-label={`${expandedParticipants.has(p.id) ? 'Hide' : 'View'} participants for ${p.name}`}
                                    aria-expanded={expandedParticipants.has(p.id)}
                                    aria-controls={`${participantsPrefix}-${p.id}`}
                                    onClick={() => setExpandedParticipants(current => {
                                        const next = new Set(current)
                                        if (next.has(p.id)) next.delete(p.id)
                                        else next.add(p.id)
                                        return next
                                    })}>
                                    {expandedParticipants.has(p.id) ? 'Hide participants' : 'View participants'} ({p.employees.length})
                                </Button>
                            </TableCell>
                        </TableRow>
                        <TableRow hidden={!expandedParticipants.has(p.id)}>
                            <TableCell colSpan={6} className="bg-muted/20 p-4 whitespace-normal">
                                <section id={`${participantsPrefix}-${p.id}`} aria-label={`Employees participating in ${p.name}`} className="grid gap-3">
                                    <h4 className="font-semibold">Participation employees</h4>
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Region</TableHead></TableRow></TableHeader>
                                        <TableBody>{p.employees.map(e => <TableRow key={e.id}>
                                            <TableCell><RecordLink type="employees" id={e.id}>{e.name}</RecordLink></TableCell><TableCell><a href={`mailto:${e.email}`}>{e.email}</a></TableCell>
                                            <TableCell>{e.phone ? <a href={`tel:${e.phone}`}>{e.phone}</a> : '—'}</TableCell><TableCell>{e.region || '—'}</TableCell>
                                        </TableRow>)}{!p.employees.length && <TableRow><TableCell colSpan={4}>No employees assigned to this participation.</TableCell></TableRow>}</TableBody>
                                    </Table>
                                </section>
                            </TableCell>
                        </TableRow>
                    </Fragment>)}{!participations.length && <TableRow><TableCell colSpan={6}>No participations recorded.</TableCell></TableRow>}</TableBody>
                </Table>
                </div>
            </details>
            <DeferredHistory key={school.updatedAt} type="schools" id={school.id} />
            <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                {editError && <p role="alert" className="text-destructive">{editError}</p>}
                <EditHistoryButton type="schools" id={school.id} />{canEdit && <Button type="button" onClick={openEdit} disabled={loadingEdit}>{loadingEdit ? 'Loading editing options…' : 'Edit'}</Button>}
            </div>
        </>}
    </div>
}
