'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Save, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageActionLink } from '@/components/records/page-action-link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { saveEmailSegment, getEmailSegment, deleteEmailSegment } from '@/app/email/actions'
import { contactEmails, lastEmailAt, emptyContactFilters, filterEmailContacts, validateContactFilters,
    validEmail, type ContactFilters, type EmailContact, type SavedSegment, type SegmentSummary } from '@/lib/email-contacts'

function timestamp(value: string | null) {
    return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Prague' }).format(new Date(value)) : 'Never tracked'
}

export function EmailContacts({ contacts, segments, trackingAddress, trackingConfigured }: {
    contacts: EmailContact[]; segments: SegmentSummary[]; trackingAddress: string; trackingConfigured: boolean
}) {
    const router = useRouter()
    const [filters, setFilters] = useState<ContactFilters>({ ...emptyContactFilters })
    const [segmentName, setSegmentName] = useState('')
    const [expandedSegments, setExpandedSegments] = useState<Record<number, SavedSegment>>({})
    const [page, setPage] = useState(1)
    const [busy, setBusy] = useState(false)
    const [notice, setNotice] = useState('')
    const [error, setError] = useState('')
    const [manualCopy, setManualCopy] = useState('')
    let filterError = ''
    try { validateContactFilters(filters) } catch (error) { filterError = (error as Error).message }
    const filtered = filterError ? [] : filterEmailContacts(contacts, filters)
    const rows = filtered
    const emails = contactEmails(rows)
    const invalidEmailCount = rows.filter(contact => !validEmail(contact.email)).length
    const pageCount = Math.max(1, Math.ceil(rows.length / 50))
    const currentPage = Math.min(page, pageCount)
    const visibleRows = rows.slice((currentPage - 1) * 50, currentPage * 50)
    const roles = [...new Set(contacts.map(c => c.role))].sort()
    const schools = [...new Map(contacts.filter(c => c.schoolId !== null).map(c => [c.schoolId!, c.school])).entries()].sort((a, b) => a[1].localeCompare(b[1]))
    const branches = [...new Map(contacts.filter(c => c.branchId !== null).map(c => [c.branchId!, c.branch])).entries()].sort((a, b) => a[1].localeCompare(b[1]))
    const regions = [...new Set(contacts.flatMap(c => c.region ? [c.region] : []))].sort()
    function changeFilter<K extends keyof ContactFilters>(key: K, value: ContactFilters[K]) {
        setFilters(current => ({ ...current, [key]: value, ...(key === 'lastEmail' && value === 'never' ? { since: '', until: '' } : {}) }))
        setPage(1); setNotice(''); setError(''); setManualCopy('')
    }
    async function copy(text: string, message: string) {
        setError(''); setNotice(''); setManualCopy('')
        try { await navigator.clipboard.writeText(text); setNotice(message) }
        catch { setManualCopy(text); setNotice('Select and copy the text below.') }
    }
    async function save() {
        setBusy(true); setError(''); setNotice('')
        try { const segment = await saveEmailSegment(segmentName, filters); setSegmentName(''); setNotice(`Saved “${segment.name}” with ${segment.contactCount} contacts.`); router.refresh() }
        catch (error) { setError(error instanceof Error ? error.message : 'Could not save the segment.') }
        finally { setBusy(false) }
    }
    async function openSegment(id: number, copyOnly = false) {
        if (!copyOnly && expandedSegments[id]) {
            setExpandedSegments(current => { const next = { ...current }; delete next[id]; return next })
            return
        }
        setBusy(true); setError(''); setNotice(''); setManualCopy('')
        try {
            const segment = await getEmailSegment(id)
            if (copyOnly) {
                const addresses = contactEmails(segment.contacts)
                if (!addresses.length) { setError('This segment has no valid email addresses.'); return }
                await copy(addresses.join(', '), `Copied ${addresses.length} unique email addresses from “${segment.name}”.`)
            } else { setExpandedSegments(current => ({ ...current, [id]: segment })) }
        } catch (error) { setError(error instanceof Error ? error.message : 'Could not load the segment.') }
        finally { setBusy(false) }
    }
    async function removeSegment(segment: SegmentSummary) {
        if (!window.confirm(`Delete the saved segment “${segment.name}”? Contacts will be kept.`)) return
        setBusy(true); setError(''); setNotice('')
        try { await deleteEmailSegment(segment.id); setExpandedSegments(current => { const next = { ...current }; delete next[segment.id]; return next }); setNotice('Segment deleted.'); router.refresh() }
        catch (error) { setError(error instanceof Error ? error.message : 'Could not delete the segment.') }
        finally { setBusy(false) }
    }
    const selectClass = 'min-w-0 rounded-md border bg-background p-2'
    return <div className="grid min-w-0 gap-6">
        <section className="grid gap-3 rounded-xl border p-5" aria-label="Email tracking mailbox">
            <h2 className="text-lg font-semibold">Track emails with CC</h2>
            <p>CC this address when emailing contacts so the CRM can record when they were contacted.</p>
            <div className="flex flex-wrap items-center gap-3"><code className="break-all">{trackingAddress}</code><Button variant="outline" disabled={!trackingConfigured} onClick={() => copy(trackingAddress, 'Tracking address copied.')}><Copy className="size-4" />Copy CC address</Button></div>
            {!trackingConfigured && <p role="status">Placeholder / setup incomplete. Post Bellum IT must configure a real mailbox and connect its inbound messages before tracking works.</p>}
        </section>
        {notice && <p role="status" aria-live="polite">{notice}</p>}
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {manualCopy && <label className="grid gap-2 text-sm">Copy this text<textarea className="min-h-24 rounded-md border p-3" readOnly value={manualCopy} onFocus={e => e.target.select()} /></label>}
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <div className="grid min-w-0 overflow-hidden rounded-xl border">
                <section className="grid gap-4 p-5" aria-labelledby="email-filters">
                    <h2 id="email-filters" className="text-lg font-semibold">Filter contacts</h2>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <label className="grid gap-2 text-sm">Name<Input type="search" maxLength={200} value={filters.name} onChange={e => changeFilter('name', e.target.value)} /></label>
                        <label className="grid gap-2 text-sm">Email<Input type="search" maxLength={200} value={filters.email} onChange={e => changeFilter('email', e.target.value)} /></label>
                        <label className="grid gap-2 text-sm">Contact role<select className={selectClass} value={filters.role} onChange={e => changeFilter('role', e.target.value)}><option value="">All roles</option>{roles.map(role => <option key={role} value={role}>{role.replaceAll('_', ' ')}</option>)}</select></label>
                        <label className="grid gap-2 text-sm">School<select className={selectClass} value={filters.school} onChange={e => changeFilter('school', e.target.value)}><option value="">All schools</option><option value="none">No school assigned</option>{schools.map(([id, name]) => <option key={id} value={String(id)}>{name || 'Unnamed school'}</option>)}</select></label>
                        <label className="grid gap-2 text-sm">Branch<select className={selectClass} value={filters.branch} onChange={e => changeFilter('branch', e.target.value)}><option value="">All branches</option><option value="none">No branch assigned</option>{branches.map(([id, name]) => <option key={id} value={String(id)}>{name || 'Unnamed branch'}</option>)}</select></label>
                        <label className="grid gap-2 text-sm">Region<select className={selectClass} value={filters.region} onChange={e => changeFilter('region', e.target.value)}><option value="">All regions</option>{regions.map(region => <option key={region} value={region}>{region}</option>)}</select></label>
                        <label className="grid gap-2 text-sm">Last email (CC or newsletter)<select className={selectClass} value={filters.lastEmail} onChange={e => changeFilter('lastEmail', e.target.value as ContactFilters['lastEmail'])}><option value="any">Any</option><option value="never">Never tracked</option><option value="contacted">Has a tracked email</option></select></label>
                        <label className="grid gap-2 text-sm">Emailed on or after<Input type="date" disabled={filters.lastEmail === 'never'} value={filters.since} onChange={e => changeFilter('since', e.target.value)} /></label>
                        <label className="grid gap-2 text-sm">Emailed on or before<Input type="date" disabled={filters.lastEmail === 'never'} value={filters.until} onChange={e => changeFilter('until', e.target.value)} /></label>
                    </div>
                    {filterError && <p role="alert" className="text-destructive">{filterError}</p>}
                    <Button className="w-fit" variant="outline" onClick={() => { setFilters({ ...emptyContactFilters }); setPage(1); setNotice(''); setError(''); setManualCopy('') }}>Reset filters</Button>
                    <form className="grid gap-3 border-t pt-4" aria-labelledby="save-segment-heading" onSubmit={e => { e.preventDefault(); void save() }}>
                        <h3 id="save-segment-heading" className="font-semibold">Save as segment</h3>
                        <div className="flex flex-wrap items-end gap-3">
                            <label className="grid gap-2 text-sm">Segment name<Input required maxLength={100} value={segmentName} onChange={e => setSegmentName(e.target.value)} /></label>
                            <Button disabled={busy || !filtered.length || Boolean(filterError) || !segmentName.trim()} type="submit"><Save className="size-4" />Save filtered results as segment</Button>
                        </div>
                    </form>
                </section>
                <section className="grid min-w-0 gap-4 border-t p-5" aria-labelledby="email-results">
                    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="email-results" className="text-lg font-semibold">Filtered contacts ({rows.length})</h2><Button variant="outline" disabled={busy || !emails.length} onClick={() => copy(emails.join(', '), `Copied ${emails.length} unique email addresses.`)}><Copy className="size-4" />Copy all emails ({emails.length})</Button></div>
                    {invalidEmailCount > 0 && <p role="status">{invalidEmailCount} contacts have missing or invalid email addresses and are excluded from copying.</p>}
                    <div className="overflow-x-auto"><Table className="min-w-[40rem] table-fixed">
                        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead className="w-28">Role</TableHead><TableHead>School</TableHead><TableHead className="w-40 whitespace-normal">Last email (CC or newsletter)</TableHead><TableHead className="sticky right-0 z-10 w-36 bg-background">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>{visibleRows.map(contact => <TableRow key={contact.id}>
                            <TableCell className="break-words whitespace-normal">{contact.name}</TableCell><TableCell className="break-all whitespace-normal">{contact.email}</TableCell><TableCell><span className="block truncate" title={contact.role.replaceAll('_', ' ')}>{contact.role.replaceAll('_', ' ')}</span></TableCell><TableCell className="break-words whitespace-normal">{contact.school || '—'}</TableCell><TableCell className="whitespace-normal">{timestamp(lastEmailAt(contact))}</TableCell><TableCell className="sticky right-0 bg-background"><PageActionLink href={`/details/contacts/${contact.id}`}>View details</PageActionLink></TableCell>
                        </TableRow>)}{!rows.length && <TableRow><TableCell colSpan={6}>No matching contacts.</TableCell></TableRow>}</TableBody>
                    </Table></div>
                    <nav aria-label="Contact result pages" className="flex items-center justify-end gap-3"><Button variant="outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span>Page {currentPage} of {pageCount}</span><Button variant="outline" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></nav>
                </section>
            </div>
            <aside className="min-w-0" aria-labelledby="email-segments">
                <section className="grid gap-3 rounded-xl border p-5" aria-labelledby="email-segments">
                    <h2 id="email-segments" className="text-lg font-semibold">My saved segments</h2>
                    {!segments.length && <p>No saved segments yet.</p>}
                    <ul className="grid gap-3">{segments.map(segment => <li key={segment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                        <div><h3 className="font-medium">{segment.name}</h3><p className="text-sm">{segment.contactCount} contacts · saved {timestamp(segment.createdAt)}</p></div>
                        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} aria-expanded={Boolean(expandedSegments[segment.id])} aria-controls={`segment-people-${segment.id}`} onClick={() => openSegment(segment.id)}>{expandedSegments[segment.id] ? 'Hide snapshot' : 'View snapshot'}</Button><Button variant="outline" disabled={busy} onClick={() => openSegment(segment.id, true)}><Copy className="size-4" />Copy emails</Button><Button variant="ghost" disabled={busy} aria-label={`Delete segment ${segment.name}`} onClick={() => removeSegment(segment)}><Trash className="size-4" /></Button></div>
                        {expandedSegments[segment.id] && <div id={`segment-people-${segment.id}`} className="w-full min-w-0 border-t pt-3">
                            <ul aria-label={`People in ${segment.name}`} className="max-h-96 divide-y overflow-y-auto">
                                {expandedSegments[segment.id].contacts.map(contact => <li key={contact.id} className="grid gap-1 py-3">
                                    <span className="font-medium">{contact.name}</span>
                                    <span className="break-all text-sm">{contact.email}</span>
                                    <span className="text-sm">{contact.role.replaceAll('_', ' ')}{contact.school ? ` · ${contact.school}` : ''}</span>
                                </li>)}
                                {!expandedSegments[segment.id].contacts.length && <li>No people in this segment.</li>}
                            </ul>
                        </div>}
                    </li>)}</ul>
                </section>
            </aside>
        </div>
    </div>
}
