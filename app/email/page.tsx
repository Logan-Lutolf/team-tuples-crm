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
    const [contacts, segments] = await Promise.all([
        loadEmailContacts(),
        db.orm.public.EmailSegment.where({ createdById: employee.id }).select('id', 'name', 'contactCount', 'createdAt').orderBy(s => s.id.desc()).all().toArray(),
    ])
    const tracking = emailTrackingSettings()
    return <article className="m-6 grid min-w-0 gap-6 lg:m-10">
        <h1 className="text-2xl font-semibold">SmartEmailing / CC tracking</h1>
        <EmailContacts contacts={contacts} segments={segments} trackingAddress={tracking.mailbox} trackingConfigured={tracking.configured} />
    </article>
}
