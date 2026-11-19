# Email and Recommendations port: changes and before/after code

Target: `edit-details2`, starting at `9e7c03c`.
Source: fetched `origin/master`, `dc9cb4c`.

The feature UI and provider client come from master. The database-facing code was
adapted to this branch instead of copying master's old Contact/School schema.
No dependencies were added, no existing tables were replaced, and the employee
model and role enum were left unchanged.

## Reviewable code

- [Full before/after patch against edit-details2](email-feature-changes.patch): all
  implementation, test, configuration, and generated-contract changes. For added
  files, `/dev/null` is the before state and the entire new file is the after state.
- [Master-to-branch adaptation patch](email-master-adaptations.patch): the exact
  changes to imported feature files relative to master's implementation.
- [IT handover and setup](email-and-recommendations.md).

The generated patches exclude these report/patch files themselves to avoid a
self-referential diff. All documentation is new; its before state was absent.

## Database: one optional field and five supporting tables

Before (`Person`):

```prisma
lastContactedById Int?
lastContactedBy Employee? @relation(fields: [lastContactedById], references: [personId])
lastContactedDate DateString?
```

After:

```prisma
lastContactedById Int?
lastContactedBy Employee? @relation(fields: [lastContactedById], references: [personId])
lastContactedDate DateString?
// Verified CC tracking is separate from newsletter activity and manual contact dates.
lastTrackedEmailAt TimestamptzString?
```

The new tables are `EmailSegment`, `TrackedEmail`, `SmartEmailContact`,
`SmartEmailEvent`, and `SmartEmailSync`. Their complete definitions are in
`prisma/contract.prisma` and the full patch. They need four supporting indexes.
Recommendations uses existing tables and adds no schema of its own.
The generated contracts, snapshot and database ref reflect this additive change.

The configured development database was updated after reviewing a dry run:
five CREATE TABLE operations, one ADD COLUMN operation and four CREATE INDEX
operations. Existing people, organizations, interactions and the dummy admin were
preserved. No seed or SmartEmailing import was run against the real account.

## Authentication and permissions

Master's `lib/current-employee.ts` assumed staff identity lived directly on Employee:

```ts
const employee = await db.orm.public.Employee.where({ id: payload.userId })
    .select('id', 'name', 'email', 'roles').first()
```

This branch keeps identity on Person and keys Employee by personId:

```ts
const [employee, person] = await Promise.all([
    db.orm.public.Employee.where({ personId: payload.userId }).select('personId', 'role').first(),
    db.orm.public.Person.where({ id: payload.userId }).select('id', 'name', 'email').first(),
])
if (!employee || !person) return null
return { id: employee.personId, name: person.name, email: person.email ?? '', roles: employee.role }
```

Current database roles determine access, so stale cookie roles cannot retain
revoked permissions. Email is for ADMIN/COORDINATOR/existing `_COORDINATOR` roles.
Unlike master, the adapter does not turn scoped assignment roles into global
permissions, and it does not add a nonexistent MARKETER role. Recommendations is
for signed-in employees. The navbar and server endpoints/actions agree on access.

## Contact queries and filters

Before (master):

```ts
db.orm.public.Contact.select('id', 'name', 'email', 'contactRole', 'schoolId', 'branchId', 'region', 'lastTrackedEmailAt')
db.orm.public.School.select('id', 'name')
```

After:

```ts
db.orm.public.Person.select('id', 'name', 'email', 'orgId', 'branchName', 'lastTrackedEmailAt')
db.orm.public.Organization.select('id', 'name', 'region')
db.orm.public.PersonRoles.all()
```

The adapter keeps the UI snapshot keys to minimize changes: `schoolId` contains
Organization.id and `branchId` contains the branch's name key. Missing person emails
become empty strings for filtering/copying; missing roles display as OTHER without
writing a role to the database. Region comes from the organization or branch.
The filter label is School / organization. Newsletter matching now uses Person.email.

## CC tracking writes

Before (master):

```ts
await tx.orm.public.Interaction.create({ contactId: contact.id, schoolId: contact.schoolId,
    employeeId: employee?.id ?? null, contactedAt: email.contactedAt, mode: 'EMAIL' })
await tx.orm.public.Contact.where({ id: contact.id }).update({
    last_contacted: latest!.contactedAt, last_contacted_byId: latest!.employeeId,
    lastTrackedEmailAt: /* latest verified email timestamp */,
})
```

After:

```ts
await tx.orm.public.Interaction.create({ personId: contact.id, organizationId: contact.orgId,
    employeeId: employee?.id ?? null, contactedAt: email.contactedAt, mode: 'EMAIL' })
const latestDate = emailDate(latest!.contactedAt)
const updateLastContact = !contact.lastContactedDate || latestDate >= contact.lastContactedDate
await tx.orm.public.Person.where({ id: contact.id }).update({
    ...(updateLastContact ? { lastContactedDate: latestDate, lastContactedById: latest!.employeeId } : {}),
    lastTrackedEmailAt: !contact.lastTrackedEmailAt || Date.parse(email.contactedAt) > Date.parse(contact.lastTrackedEmailAt)
        ? email.contactedAt : contact.lastTrackedEmailAt,
})
```

Sender lookup also moved from Employee.email to Person.email plus an Employee row.
`employee.id` in this adapter is the existing Employee.personId. Date conversion
uses Europe/Prague because this branch's last-contact field is a date, not a timestamp.
Existing newer manual contact dates are preserved. Authentication, relay verification,
body limits, duplicate detection and transaction boundaries remain in place.

## Recommendation queries

Before (master) selected School records or school-free Program records:

```sql
SELECT id, name FROM public."School" WHERE NOT (SELECT organization_view FROM settings)
UNION ALL
SELECT id, name FROM public."Program" p WHERE (SELECT organization_view FROM settings)
    AND EXISTS (SELECT 1 FROM public."Participation" e
        WHERE e."programId" = p.id AND e."schoolId" IS NULL AND e.status <> 'CANCELLED')
```

After, the real Organization table determines the view:

```sql
SELECT id, name FROM public."Organization" o
WHERE CASE WHEN (SELECT organization_view FROM settings)
    THEN o.type IN ('THEATRE', 'CULTURAL')
    ELSE o.type IS NULL OR o.type IN ('PRIMARY_SCHOOL', 'SECONDARY_SCHOOL') END
```

Other mappings: Contact -> Person, ContactEmployment -> PersonEmployment,
contactId -> personId, Participation.schoolId -> organizationId, and
Contact.contactRole -> PersonRoles.type. Organization links use the branch's
existing `/details/schools/:id` route. The four cards, thresholds, ranking, contact
suggestions, empty states and failure state are retained from master. A view selector
on `/recommendations` replaces an account-email-specific view choice.

## Navigation and person details

Before: the navbar had no Email or Recommendations links, and person details had no
newsletter-history section.

After (`components/top-navbar.tsx`):

```tsx
<NavigationMenuItem>
  <NavigationMenuLink href="/recommendations">Recommendations</NavigationMenuLink>
</NavigationMenuItem>
{canUseEmailContacts(employee.role) && <NavigationMenuItem>
  <NavigationMenuLink href="/email">SmartEmailing / CC tracking</NavigationMenuLink>
</NavigationMenuItem>}
```

After (`app/details/pages/person-details-page.tsx`):

```tsx
<PersonEmailHistory email={person.email} lastTrackedEmailAt={person.lastTrackedEmailAt} />
```

The new server component checks permission before querying/displaying history and
handles missing addresses. `proxy.ts` now protects both route prefixes; each page
also performs its own current-employee check.

## Checks and limitations

- 11 filter/scheduler tests passed.
- 8 integration tests (including the parent test) passed on disposable Postgres:
  live-role authorization, nullable contacts, private snapshots, CC validation,
  deduplication/date preservation, provider ACK replay/lease, and recommendations.
- Authenticated HTTP checks returned 200 for `/email`, `/recommendations`, and
  `/recommendations?view=organizations`, with expected content and no query error.
  Anonymous `/email` access redirected to `/login` (307).
- Prisma database/contract verification passed after the additive update.
- Targeted ESLint passed with zero errors. Its 14 warnings are pre-existing unused
  imports/variables in the two existing UI files touched by this port.
- The branch starts with 242 TypeScript diagnostics. The same diagnostics remain;
  this change introduces none. A clean production build still requires resolving
  that pre-existing branch-wide debt. This port does not refactor unrelated pages.
- Live mailbox and SmartEmailing account connections were not configured or called.
  IT must supply the settings and connector/scheduler described in the handover.

## Complete file inventory

The following generated inventory lists every file changed or added for this task.
<!-- file-inventory -->

| File | Change |
| --- | --- |
| [.env.example](../.env.example) | Added |
| [.gitignore](../.gitignore) | Modified |
| [README.md](../README.md) | Modified |
| [app/api/email-tracking/route.ts](../app/api/email-tracking/route.ts) | Added |
| [app/api/smartemailing/sync/route.ts](../app/api/smartemailing/sync/route.ts) | Added |
| [app/dashboard/recommendation-data.ts](../app/dashboard/recommendation-data.ts) | Added |
| [app/dashboard/recommendations.tsx](../app/dashboard/recommendations.tsx) | Added |
| [app/details/pages/person-details-page.tsx](../app/details/pages/person-details-page.tsx) | Modified |
| [app/email/actions.ts](../app/email/actions.ts) | Added |
| [app/email/page.tsx](../app/email/page.tsx) | Added |
| [app/recommendations/page.tsx](../app/recommendations/page.tsx) | Added |
| [components/email/email-contacts.tsx](../components/email/email-contacts.tsx) | Added |
| [components/email/person-email-history.tsx](../components/email/person-email-history.tsx) | Added |
| [components/email/smartemailing-history.tsx](../components/email/smartemailing-history.tsx) | Added |
| [components/top-navbar.tsx](../components/top-navbar.tsx) | Modified |
| [docs/email-and-recommendations.md](../docs/email-and-recommendations.md) | Added |
| [docs/email-feature-changes.md](../docs/email-feature-changes.md) | Added |
| [docs/email-feature-changes.patch](../docs/email-feature-changes.patch) | Added |
| [docs/email-master-adaptations.patch](../docs/email-master-adaptations.patch) | Added |
| [lib/current-employee.ts](../lib/current-employee.ts) | Added |
| [lib/email-contacts-server.ts](../lib/email-contacts-server.ts) | Added |
| [lib/email-contacts.ts](../lib/email-contacts.ts) | Added |
| [lib/email-tracking-input.ts](../lib/email-tracking-input.ts) | Added |
| [lib/email-tracking.ts](../lib/email-tracking.ts) | Added |
| [lib/smartemailing-api.ts](../lib/smartemailing-api.ts) | Added |
| [lib/smartemailing-data.ts](../lib/smartemailing-data.ts) | Added |
| [lib/smartemailing-sync.ts](../lib/smartemailing-sync.ts) | Added |
| [migrations/app/refs/db.json](../migrations/app/refs/db.json) | Modified (generated by Prisma) |
| [migrations/snapshots/733bdcbceb4ed30fd315072cf1701fcad36a71619f63792baf2f590603765559/contract.d.ts](../migrations/snapshots/733bdcbceb4ed30fd315072cf1701fcad36a71619f63792baf2f590603765559/contract.d.ts) | Added (generated by Prisma) |
| [migrations/snapshots/733bdcbceb4ed30fd315072cf1701fcad36a71619f63792baf2f590603765559/contract.json](../migrations/snapshots/733bdcbceb4ed30fd315072cf1701fcad36a71619f63792baf2f590603765559/contract.json) | Added (generated by Prisma) |
| [package.json](../package.json) | Modified |
| [prisma/contract.d.ts](../prisma/contract.d.ts) | Modified (generated by Prisma) |
| [prisma/contract.json](../prisma/contract.json) | Modified (generated by Prisma) |
| [prisma/contract.prisma](../prisma/contract.prisma) | Modified |
| [proxy.ts](../proxy.ts) | Modified |
| [scripts/sync-smartemailing.mjs](../scripts/sync-smartemailing.mjs) | Added |
| [tests/email/contacts.test.mjs](../tests/email/contacts.test.mjs) | Added |
| [tests/email/features.integration.mjs](../tests/email/features.integration.mjs) | Added |
| [tests/email/smartemailing-scheduler.test.mjs](../tests/email/smartemailing-scheduler.test.mjs) | Added |
