'use client'
import { useState } from 'react'
import { SchoolActionForm } from './school-action-form'
import { recordSchoolInteraction } from './actions_schools'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Option, SchoolInteraction } from './school-form-types'

export function SchoolInteractions({ schoolId, contacts, employees, programs, interactions }: {
    schoolId: number; contacts: Option[]; employees: Option[]; programs: Option[]; interactions: SchoolInteraction[]
}) {
    const [after, setAfter] = useState('')
    const [before, setBefore] = useState('')
    const filtered = interactions.filter(i => (!after || i.contactedAt.slice(0, 10) >= after) && (!before || i.contactedAt.slice(0, 10) <= before))
    return <section className="grid gap-3">
        <h3 className="font-semibold">Contact history</h3>
        <section aria-label="Filter history" className="grid gap-3 rounded-lg border bg-muted/20 p-4">
            <h4 className="font-medium">Filter history</h4>
            <p className="text-sm text-muted-foreground">Choose a date range to view existing interactions. These dates only filter the records below.</p>
        <div className="flex flex-wrap gap-3">
            <label>From (UTC)<Input type="date" value={after} onChange={e => setAfter(e.target.value)} /></label>
            <label>Through (UTC)<Input type="date" value={before} onChange={e => setBefore(e.target.value)} /></label>
        </div>
        {filtered.length ? <ul className="grid gap-2">{filtered.map(i => <li key={i.id}>
            {i.contactedAt.replace('T', ' ').slice(0, 19)} UTC · {employees.find(e => e.id === i.employeeId)?.name ?? `Employee #${i.employeeId}`} → {contacts.find(c => c.id === i.contactId)?.name ?? `Contact #${i.contactId}`} · {i.mode.replaceAll('_', ' ')}{i.programId ? ` · ${programs.find(p => p.id === i.programId)?.name ?? `Program #${i.programId}`}` : ''}
        </li>)}</ul> : <p>No interactions in this date range.</p>}
        </section>
        <section aria-label="Record a new interaction" className="mt-3 grid gap-3 rounded-lg border p-4">
            <h4 className="font-medium">Record a new interaction</h4>
            <p className="text-sm text-muted-foreground">Enter who made contact and when it happened. Use your local time.</p>
        {contacts.length && employees.length ? <SchoolActionForm action={async data => {
            const date = new Date(String(data.get('contacted-at-local') ?? ''))
            if (!Number.isFinite(date.getTime())) return { error: 'Enter a valid contact date.' }
            data.set('contacted-at', date.toISOString())
            return recordSchoolInteraction(data)
        }} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="school-id" value={schoolId} />
            <label>Employee<select className="block w-full rounded border p-2" name="employee-id" required defaultValue=""><option value="" disabled>Choose employee</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
            <label>Contact<select className="block w-full rounded border p-2" name="contact-id" required defaultValue=""><option value="" disabled>Choose contact</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label>Program (optional)<select className="block w-full rounded border p-2" name="program-id"><option value="">No program</option>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <label>Communication<select className="block w-full rounded border p-2" name="mode" required>{['PHONE', 'EMAIL', 'IN_PERSON', 'VIDEO_CALL', 'MESSAGE', 'OTHER'].map(m => <option key={m} value={m}>{m.replaceAll('_', ' ')}</option>)}</select></label>
            <label>Date and time (local)<Input name="contacted-at-local" type="datetime-local" required /></label>
            <Button type="submit">Record interaction</Button>
        </SchoolActionForm> : <p>Add a school contact and an employee before recording interactions.</p>}
        </section>
    </section>
}
