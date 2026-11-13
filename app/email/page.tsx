import { loadSmartEmailStatus } from '@/lib/smartemailing-data'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/prisma/db'
import { currentEmployee } from '@/lib/current-employee'
import { loadEmailContacts } from '@/lib/email-contacts-server'
import { emailTrackingSettings } from '@/lib/email-tracking'
import { canUseEmailContacts } from '@/lib/email-contacts'
import { EmailContacts } from '@/components/email/email-contacts'

export default async function EmailPage() {
    const employee = await currentEmployee()
    if (!employee) redirect('/login')
    if (!canUseEmailContacts(employee.roles)) notFound()
    const [contacts, smartEmailing, segments] = await Promise.all([
        loadEmailContacts(),
        loadSmartEmailStatus(),
        db.orm.public.EmailSegment.where({ createdById: employee.id }).select('id', 'name', 'contactCount', 'createdAt').orderBy(s => s.id.desc()).all().toArray(),
    ])
    const tracking = emailTrackingSettings()
    return <article className="m-6 grid min-w-0 gap-6 lg:m-10">
        <h1 className="text-2xl font-semibold">Smart emailing</h1>
        <section className="grid gap-2 rounded-xl border p-5" aria-label="SmartEmailing sync status">
            <h2 className="text-lg font-semibold">SmartEmailing newsletters</h2>
            <p>{smartEmailing.configured ? 'Read-only connection configured.' : 'Not configured — ask IT to connect SmartEmailing.'} Newsletter deliveries are included in the last-email filter. Open a contact’s details for newsletters, engagement, subscriptions and lists.</p>
            {smartEmailing.lastError && <p role="status">The last sync failed; previously imported data is shown. Ask IT to check the sync job.</p>}
        </section>
        <EmailContacts contacts={contacts} segments={segments} trackingAddress={tracking.mailbox} trackingConfigured={tracking.configured} />
    </article>
}
