import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/prisma/db'
import { currentEmployee } from '@/lib/current-employee'
import { canUseEmailContacts } from '@/lib/email-contacts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const PAGE_SIZE = 50
const dates = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Prague' })

function recipients(json: string): string[] {
    try {
        const value: unknown = JSON.parse(json)
        return Array.isArray(value) && value.every(address => typeof address === 'string') ? value : []
    } catch { return [] }
}

export default async function TrackedEmailsPage({ searchParams }: {
    searchParams: Promise<{ page?: string }>
}) {
    const employee = await currentEmployee()
    if (!employee) redirect('/login')
    if (!canUseEmailContacts(employee.roles)) notFound()
    const rawPage = (await searchParams).page ?? '1'
    const page = Number(rawPage)
    if (!/^\d+$/.test(rawPage) || !Number.isSafeInteger(page) || page < 1 || page > 1_000_000) notFound()
    const results = await db.orm.public.TrackedEmail
        .orderBy([email => email.contactedAt.desc(), email => email.id.desc()])
        .offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE + 1).all().toArray()
    const hasNext = results.length > PAGE_SIZE
    const emails = results.slice(0, PAGE_SIZE)

    return <article className="m-6 grid min-w-0 gap-6 lg:m-10">
        <Link href="/email" className="w-fit underline">Back to Emailing</Link>
        <h1 className="text-2xl font-semibold">All tracked emails</h1>
        <p>Emails recorded through CC tracking, newest first. Only metadata is stored, not subjects, message bodies or attachments. Times are shown in Prague time.</p>
        <div className="overflow-x-auto rounded-xl border">
            <Table>
                <TableHeader><TableRow><TableHead>Sent</TableHead><TableHead>From</TableHead><TableHead>Recipients (To / CC)</TableHead><TableHead>Matched CRM contacts</TableHead><TableHead>Recorded</TableHead></TableRow></TableHeader>
                <TableBody>{emails.map(email => <TableRow key={email.id}>
                    <TableCell className="whitespace-nowrap">{dates.format(new Date(email.contactedAt))}</TableCell>
                    <TableCell className="break-all">{email.fromEmail}<details className="mt-1 text-sm"><summary className="cursor-pointer">Message ID</summary><code>{email.id}</code></details></TableCell>
                    <TableCell><ul>{recipients(email.recipientEmails).map(address => <li key={address} className="break-all">{address}</li>)}</ul></TableCell>
                    <TableCell>{email.matchedContactCount}</TableCell>
                    <TableCell className="whitespace-nowrap">{dates.format(new Date(email.receivedAt))}</TableCell>
                </TableRow>)}{!emails.length && <TableRow><TableCell colSpan={5}>No tracked emails on this page. Emails appear here after the CC connector processes them.</TableCell></TableRow>}</TableBody>
            </Table>
        </div>
        <p className="text-sm text-muted-foreground">Recipients exclude the sender and tracking mailbox. Manually logged or spreadsheet-imported interactions and SmartEmailing events are separate from this list.</p>
        <nav aria-label="Tracked email pages" className="flex items-center justify-end gap-4">
            {page > 1 && <Link href={`/email/tracked?page=${page - 1}`} className="underline">Previous</Link>}
            <span>Page {page}</span>
            {hasNext && <Link href={`/email/tracked?page=${page + 1}`} className="underline">Next</Link>}
        </nav>
    </article>
}
