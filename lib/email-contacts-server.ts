import 'server-only'
import { db } from '@/prisma/db'
import { currentEmployee } from '@/lib/current-employee'
import { canUseEmailContacts, type EmailContact } from '@/lib/email-contacts'

export async function requireEmailAccess() {
    const employee = await currentEmployee()
    if (!employee || !canUseEmailContacts(employee.roles)) throw new Error('Only administrators, coordinators and marketers can use email contacts.')
    return employee
}

export async function loadEmailContacts(): Promise<EmailContact[]> {
    const [contacts, schools, branches, deliveries] = await Promise.all([
        db.orm.public.Contact.select('id', 'name', 'email', 'contactRole', 'schoolId', 'branchId', 'region', 'lastTrackedEmailAt').orderBy(c => c.name.asc()).all().toArray(),
        db.orm.public.School.select('id', 'name').all().toArray(),
        db.orm.public.Branch.select('id', 'name').all().toArray(),
        db.runtime().query(db.raw.sql`SELECT email, max("occurredAt")::text AS latest FROM public."SmartEmailEvent" WHERE type = 'email.delivered' GROUP BY email`
            .returnsRow({ email: { codecId: 'pg/text@1' }, latest: { codecId: 'pg/text@1' } }).build()),
    ])
    const deliveryDates = new Map(deliveries.map(row => [row.email, row.latest]))
    const schoolNames = new Map(schools.map(s => [s.id, s.name]))
    const branchNames = new Map(branches.map(b => [b.id, b.name]))
    return contacts.map(contact => ({
        id: contact.id, name: contact.name, email: contact.email, role: contact.contactRole,
        schoolId: contact.schoolId, school: schoolNames.get(contact.schoolId ?? -1) ?? '',
        branchId: contact.branchId, branch: branchNames.get(contact.branchId ?? -1) ?? '',
        region: contact.region, lastTrackedEmailAt: contact.lastTrackedEmailAt,
        smartEmailingLastDeliveredAt: deliveryDates.get(contact.email.trim().toLowerCase()) ?? null,
    }))
}
