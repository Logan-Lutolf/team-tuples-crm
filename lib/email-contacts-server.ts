import 'server-only'
import { db } from '@/prisma/db'
import { currentEmployee } from '@/lib/current-employee'
import { canUseEmailContacts, type SmartCampaignActivity, type SmartEmailFiltersData, type EmailContact } from '@/lib/email-contacts'

export async function requireEmailAccess() {
    const employee = await currentEmployee()
    if (!employee || !canUseEmailContacts(employee.roles)) throw new Error('Only administrators and coordinators can use email contacts.')
    return employee
}

export async function loadEmailContacts(): Promise<EmailContact[]> {
    const [contacts, organizations, branches, roles, activity, profiles] = await Promise.all([
        db.orm.public.Person.select('id', 'name', 'email', 'orgId', 'branchName', 'lastTrackedEmailAt').orderBy(c => c.name.asc()).all().toArray(),
        db.orm.public.Organization.select('id', 'name', 'region').all().toArray(),
        db.orm.public.Branch.select('name', 'region').all().toArray(),
        db.orm.public.PersonRoles.all().toArray(),
        db.runtime().query(db.raw.sql`SELECT e.email, e."campaignName" AS name,
            max(e."occurredAt") FILTER (WHERE e.type = 'email.delivered')::text AS delivered,
            COALESCE(jsonb_agg(DISTINCT to_char(e."occurredAt" AT TIME ZONE 'Europe/Prague', 'YYYY-MM-DD')) FILTER (WHERE e.type = 'email.opened'), '[]'::jsonb)::text AS opens,
            COALESCE(jsonb_agg(DISTINCT to_char(e."occurredAt" AT TIME ZONE 'Europe/Prague', 'YYYY-MM-DD')) FILTER (WHERE e.type = 'email.clicked'), '[]'::jsonb)::text AS clicks
            FROM public."SmartEmailEvent" e
            WHERE e.type IN ('email.delivered', 'email.opened', 'email.clicked')
              AND EXISTS (SELECT 1 FROM public."Person" c WHERE lower(trim(c.email)) = e.email)
            GROUP BY e.email, e."campaignName"`
            .returnsRow({ email: { codecId: 'pg/text@1' }, name: { codecId: 'pg/text@1' }, delivered: { codecId: 'pg/text@1' }, opens: { codecId: 'pg/text@1' }, clicks: { codecId: 'pg/text@1' } }).build()),
        db.runtime().query(db.raw.sql`SELECT p.email, p."listsJson" AS lists, p.blacklisted, p."hardBounced" AS hard, p."softBounces" AS soft
            FROM public."SmartEmailContact" p JOIN public."SmartEmailSync" s ON s.id = 'smartemailing'
            WHERE p."syncedAt" >= s."contactsSyncedAt"
              AND EXISTS (SELECT 1 FROM public."Person" c WHERE lower(trim(c.email)) = p.email)
            ORDER BY p."syncedAt" DESC`
            .returnsRow({ email: { codecId: 'pg/text@1' }, lists: { codecId: 'pg/text@1' }, blacklisted: { codecId: 'pg/bool@1' }, hard: { codecId: 'pg/bool@1' }, soft: { codecId: 'pg/int4@1' } }).build()),
    ])
    const campaignsByEmail = new Map<string, SmartCampaignActivity[]>()
    const deliveryDates = new Map<string, string>()
    for (const row of activity) {
        const campaigns = campaignsByEmail.get(row.email) ?? []
        campaigns.push({ name: row.name, deliveredAt: row.delivered, openDates: JSON.parse(row.opens), clickDates: JSON.parse(row.clicks) })
        campaignsByEmail.set(row.email, campaigns)
        if (row.delivered && (!deliveryDates.has(row.email) || Date.parse(row.delivered) > Date.parse(deliveryDates.get(row.email)!))) deliveryDates.set(row.email, row.delivered)
    }
    const profilesByEmail = new Map<string, SmartEmailFiltersData>()
    for (const row of profiles) {
        if (!profilesByEmail.has(row.email)) profilesByEmail.set(row.email, { lists: JSON.parse(row.lists), blacklisted: row.blacklisted, hardBounced: row.hard, softBounces: row.soft })
    }
    const organizationById = new Map(organizations.map(o => [o.id, o]))
    const branchByName = new Map(branches.map(b => [b.name, b]))
    const roleByPerson = new Map(roles.map(r => [r.personId, r.type]))
    // Keep master's UI snapshot keys; schoolId now identifies an Organization and branchId a branch name.
    return contacts.map(contact => ({
        id: contact.id, name: contact.name, email: contact.email ?? '', role: roleByPerson.get(contact.id) ?? 'OTHER',
        schoolId: contact.orgId, school: organizationById.get(contact.orgId ?? -1)?.name ?? '',
        branchId: contact.branchName, branch: contact.branchName ?? '',
        region: organizationById.get(contact.orgId ?? -1)?.region ?? (contact.branchName ? branchByName.get(contact.branchName)?.region : null) ?? null,
        lastTrackedEmailAt: contact.lastTrackedEmailAt,
        smartEmailingLastDeliveredAt: deliveryDates.get(contact.email?.trim().toLowerCase() ?? '') ?? null,
        smartEmailing: profilesByEmail.get(contact.email?.trim().toLowerCase() ?? '') ?? null,
        smartCampaigns: campaignsByEmail.get(contact.email?.trim().toLowerCase() ?? '') ?? [],
    }))
}
