'use client'

import { useState, type ComponentProps, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EditSchoolForm } from './edit-school-form'

type Props = ComponentProps<typeof EditSchoolForm> & { createdAt: string; updatedAt: string; onDetailsRefresh?: () => void }

function Record({ label, children }: { label: string; children: ReactNode }) {
    return <div className="min-w-0"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-words">{children || '—'}</dd></div>
}

function Timestamp({ value }: { value: string | null }) {
    return value ? <time dateTime={value}>{value.replace('T', ' ').slice(0, 19)} UTC</time> : <>—</>
}

export function SchoolDetails(school: Props) {
    const [editing, setEditing] = useState(false)
    const programName = (id: number) => school.programs.find(p => p.id === id)?.name ?? `Program #${id}`
    const employeeName = (id: number) => school.availableEmployees.find(e => e.id === id)?.name ?? `Employee #${id}`
    const contactName = (id: number) => school.contacts.find(c => c.id === id)?.name ?? `Contact #${id}`
    return <div className="grid gap-6">
        <DialogHeader>
            <DialogTitle>{editing ? `Edit ${school.name}` : school.name}</DialogTitle>
            <DialogDescription>{editing ? 'Update school fields, contacts, participations, and contact history.' : 'School details and related records.'}</DialogDescription>
        </DialogHeader>
        {editing ? <>
            <Button type="button" variant="outline" className="w-fit" onClick={() => { setEditing(false); school.onDetailsRefresh?.() }}>Back to details</Button>
            <EditSchoolForm {...school} />
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
                    <Record label="Branch">{school.branches.find(b => b.id === school.branchId)?.name ?? `Branch #${school.branchId}`}</Record>
                    <Record label="Created"><Timestamp value={school.createdAt} /></Record>
                    <Record label="Updated"><Timestamp value={school.updatedAt} /></Record>
                </dl>
            </section>
            <section className="grid gap-3">
                <h3 className="font-semibold">School contacts</h3>
                {school.contacts.length ? <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead></TableRow></TableHeader>
                    <TableBody>{school.contacts.map(c => <TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell>{c.contactRole.replaceAll('_', ' ')}</TableCell><TableCell><a href={`mailto:${c.email}`}>{c.email}</a></TableCell><TableCell>{c.phone || '—'}</TableCell></TableRow>)}</TableBody>
                </Table> : <p className="text-muted-foreground">No contacts assigned.</p>}
            </section>
            <section className="grid gap-3">
                <h3 className="font-semibold">Participations</h3>
                {school.participations.length ? <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Program</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead><TableHead>Employees</TableHead></TableRow></TableHeader>
                    <TableBody>{school.participations.map(p => <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell>{programName(p.programId)}</TableCell><TableCell><Timestamp value={p.startDate} /></TableCell><TableCell><Timestamp value={p.endDate} /></TableCell><TableCell>{p.status}</TableCell><TableCell className="whitespace-normal">{p.employees.map(e => e.name).join(', ') || 'No employees assigned'}</TableCell></TableRow>)}</TableBody>
                </Table> : <p className="text-muted-foreground">No participations recorded.</p>}
            </section>
            <section className="grid gap-3">
                <h3 className="font-semibold">Contact history</h3>
                {school.interactions.length ? <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Employee</TableHead><TableHead>Contact</TableHead><TableHead>Communication</TableHead><TableHead>Program</TableHead></TableRow></TableHeader>
                    <TableBody>{school.interactions.map(i => <TableRow key={i.id}><TableCell><Timestamp value={i.contactedAt} /></TableCell><TableCell>{employeeName(i.employeeId)}</TableCell><TableCell>{contactName(i.contactId)}</TableCell><TableCell>{i.mode.replaceAll('_', ' ')}</TableCell><TableCell>{i.programId ? programName(i.programId) : '—'}</TableCell></TableRow>)}</TableBody>
                </Table> : <p className="text-muted-foreground">No interactions recorded.</p>}
            </section>
            <div className="flex justify-end border-t pt-4">
                <Button type="button" onClick={() => setEditing(true)}>Edit</Button>
            </div>
        </>}
    </div>
}
