'use client'
import { useEffect, useState } from 'react'
import { getRecordHistory } from '@/app/details/history-actions'
import { RecordLink } from './record-link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type History = Awaited<ReturnType<typeof getRecordHistory>>
export function DeferredHistory({ type, id }: { type: 'schools' | 'contacts' | 'programs'; id: number }) {
    const [open, setOpen] = useState(false)
    const [data, setData] = useState<History | null>(null)
    const [error, setError] = useState(false)
    const [attempt, setAttempt] = useState(0)
    useEffect(() => {
        if (!open || data) return
        let active = true
        getRecordHistory(type, id).then(result => { if (active) setData(result) })
            .catch(() => { if (active) setError(true) })
        return () => { active = false }
    }, [open, data, type, id, attempt])
    const name = (items: { id: number; name: string }[], value: number | null) => items.find(item => item.id === value)?.name ?? (value === null ? 'Deleted / unassigned' : `#${value}`)
    return <details className="rounded-lg border" onToggle={event => setOpen(event.currentTarget.open)}>
        <summary className="cursor-pointer p-4 font-semibold">Contact history{data ? ` (${data.records.length})` : ''}</summary>
        <div className="grid gap-3 border-t p-4">
            {error ? <div role="alert">Could not load contact history. <Button variant="outline" onClick={() => { setError(false); setAttempt(a => a + 1) }}>Try again</Button></div> : !data ? <p role="status">Loading contact history…</p> : <Table>
                <TableHeader><TableRow><TableHead>Date (UTC)</TableHead><TableHead>Employee</TableHead><TableHead>Contact</TableHead><TableHead>School</TableHead><TableHead>Program</TableHead><TableHead>Communication</TableHead></TableRow></TableHeader>
                <TableBody>{data.records.map(record => <TableRow key={record.id}>
                    <TableCell>{new Date(record.contactedAt).toISOString().replace('T', ' ').slice(0, 19)}</TableCell>
                    <TableCell><RecordLink type="employees" id={record.employeeId}>{name(data.employees, record.employeeId)}</RecordLink></TableCell>
                    <TableCell><RecordLink type="contacts" id={record.contactId}>{name(data.contacts, record.contactId)}</RecordLink></TableCell>
                    <TableCell><RecordLink type="schools" id={record.schoolId}>{name(data.schools, record.schoolId)}</RecordLink></TableCell>
                    <TableCell><RecordLink type="programs" id={record.programId}>{name(data.programs, record.programId)}</RecordLink></TableCell>
                    <TableCell>{record.mode.replaceAll('_', ' ')}</TableCell>
                </TableRow>)}{!data.records.length && <TableRow><TableCell colSpan={6}>No interactions recorded.</TableCell></TableRow>}</TableBody>
            </Table>}
        </div>
    </details>
}
