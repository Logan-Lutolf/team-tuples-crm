import 'server-only'
import { or } from '@prisma/orm-postgres/orm-client'
import { db } from '@/prisma/db'
import { validEmail } from '@/lib/email-contacts'
import { EmailTrackingError, type TrackedEmailInput } from '@/lib/email-tracking-input'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
const escapeLike = (email: string) => email.replace(/[\\%_]/g, '\\$&')

export function emailTrackingSettings() {
    const mailbox = process.env.EMAIL_TRACKING_CC_ADDRESS?.trim().toLowerCase() ?? ''
    const secret = process.env.EMAIL_TRACKING_WEBHOOK_SECRET ?? ''
    const validMailbox = validEmail(mailbox) && !mailbox.endsWith('.invalid')
    return { mailbox: validMailbox ? mailbox : 'crm-tracking@example.invalid', secret,
        configured: validMailbox && secret.length >= 32,
        allowedSenders: (process.env.EMAIL_TRACKING_ALLOWED_SENDERS ?? '').split(',').map(email => email.trim().toLowerCase()).filter(validEmail) }
}

export async function recordTrackedEmail(tx: Transaction, email: TrackedEmailInput, allowedSenders: readonly string[]) {
    const employees = await tx.orm.public.Employee.where(e => e.email.ilike(escapeLike(email.from))).select('id', 'name').limit(2).all().toArray()
    if (employees.length > 1 || (!employees.length && !allowedSenders.includes(email.from))) throw new EmailTrackingError('The original sender is not an employee or an approved organization sender.', 403)
    const employee = employees[0]
    await tx.query(db.raw.sql`SELECT
        set_config('crm.actor_id', ${employee ? String(employee.id) : ''}, true) AS actor_id,
        set_config('crm.actor_name', ${employee ? employee.name : `Organization email: ${email.from}`}, true) AS actor_name`
        .returnsRow({ actor_id: { codecId: 'pg/text@1' }, actor_name: { codecId: 'pg/text@1' } }).build())
    // This insert and all contact changes share a transaction. A duplicate Message-ID rolls back.
    await tx.orm.public.TrackedEmail.create({ id: email.messageId, fingerprint: email.fingerprint,
        fromEmail: email.from, contactedAt: email.contactedAt, recipientEmails: JSON.stringify(email.recipients), matchedContactCount: 0 })
    const contacts = email.recipients.length ? await tx.orm.public.Contact
        .where(c => or(...email.recipients.map(address => c.email.ilike(escapeLike(address)))))
        .orderBy(c => c.id.asc()).forUpdate().all().toArray() : []
    for (const contact of contacts) {
        await tx.orm.public.Interaction.create({ contactId: contact.id, schoolId: contact.schoolId,
            employeeId: employee?.id ?? null, contactedAt: email.contactedAt, mode: 'EMAIL' })
        const latest = await tx.orm.public.Interaction.where({ contactId: contact.id }).orderBy([i => i.contactedAt.desc(), i => i.id.desc()]).first()
        // Older mailbox notifications must not move either last-contacted date backwards.
        await tx.orm.public.Contact.where({ id: contact.id }).update({
            last_contacted: latest!.contactedAt, last_contacted_byId: latest!.employeeId,
            lastTrackedEmailAt: !contact.lastTrackedEmailAt || Date.parse(email.contactedAt) > Date.parse(contact.lastTrackedEmailAt)
                ? email.contactedAt : contact.lastTrackedEmailAt,
        })
    }
    await tx.orm.public.TrackedEmail.where({ id: email.messageId }).update({ matchedContactCount: contacts.length })
    return { matchedContacts: contacts.length, duplicate: false }
}
