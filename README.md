This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Branch and interaction schema migration

The migration `20261103T1944_branch_and_interaction_updates` is already prepared.
Do not run `migration plan` again for these changes.

It creates `EmployeeAssignment` and `Interaction`, adds optional branch institute/chief
fields, and adds a required participation name. Existing employee roles and regions
are copied into assignments before `Employee.role` is dropped. Branch/program scopes
remain null because the old data did not record them. Existing participations receive
editable names of the form `Participation #<id>`.

Old `SchoolEmployees` rows are preserved by renaming the table to
`LegacySchoolEmployees`. This archive is included in the contract; new contact history
belongs in `Interaction`. No historical interaction timestamps, contacts, or communication
modes are invented. Existing contact last-contacted summaries remain unchanged; future
interaction writes must maintain these summaries in application code.

Before applying, back up important data and confirm `.env.local` points to the intended
database. Stop the development server, then run:

```bash
npm run db:migrations:check
npm run db:migrate:preview
# Review the route, including any earlier pending migrations, before applying:
npm run db:migrate
```

The application now reads employee roles from `EmployeeAssignment`. Employee forms
edit global roles while preserving branch/program/regional assignments. School forms
show archived employee links separately and record new contact history in `Interaction`.
Participation forms require a name. The sample seed uses the new models and no longer
removes existing schools; it is optional and should only be used for test data.
Restart the development server after migrating or regenerating the contract.

The Next.js TypeScript check excludes historical `migrations/` sources, whose frozen
snapshots may use older SDK types. Validate migration artifacts with
`npm run db:migrations:check` and the integration tests below instead.

Local migration integration tests use a disposable PostgreSQL instance and never read
`DATABASE_URL`. Start a local test server and supply its port:

```bash
MIGRATION_TEST_PORT=55439 node --test tests/migrations/branch-and-interaction.mjs
```

The tests create and drop their own temporary databases. They check populated and empty
schemas, preservation, role-copy idempotence, transactional rollback, current ORM queries,
and contact-history summary updates. They execute
emitted SQL and postchecks; they do not exercise the CLI's live contract-marker handling.

### Apply database migrations

Set `DATABASE_URL` in `.env.local` to the same PostgreSQL database used by the app, then run:

```bash
npm run db:migrations:check
npm run db:migrate:preview
npm run db:migrate
```

The contact-role migration adds the required `Contact.contactRole` column and assigns
`OTHER` to existing contacts. It also drops the old `branchRole` and `subject`
columns, including their data. Back up any values you need before applying it.
Restart the development server after applying migrations.

After editing a migration's `migration.ts`, run it with Node to regenerate its
`ops.json` and `migration.json`; do not edit those generated files directly.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Contact employment history

Contacts now have explicit `ContactEmployment` periods with school, job title, start/end
calendar dates, and optional notes. The contact details page shows history newest first;
Edit enables add, update, and confirmed deletion. Overlapping appointments are allowed.
Dates are normalized to UTC midnight and displayed as calendar dates. Blank end dates
represent open-ended employment. `Contact.schoolId` remains the primary school association
and is not changed by employment-history actions. Existing school links are not backfilled
because their actual employment start dates were never recorded.

Before using employment history, back up important data and review/apply the prepared
`20261104T1742_contact_employment_history` migration:

```bash
npm run db:migrations:check
npm run db:migrate:preview
npm run db:migrate
```

This migration creates the employment table and also incorporates the additional
`EmployeeJobRole` values present in the contract. The following `20261104T1749_remove_school_employee_archive` migration permanently
drops `LegacySchoolEmployees` and its archived link records, as requested. Employee and
school records, employment history, and interactions are retained. No hosted migration is applied automatically by code generation.

Validation tests:

```bash
node --test tests/contacts/employment.test.mjs
```

The disposable-database integration suite also verifies employment creation, updates,
deletion, preservation of primary school links, and rejection of cross-contact mutations.

The archive-removal migration is separate from employment-history creation so the
existing migration history is retained. Review both pending steps with
`npm run db:migrate:preview` before running `npm run db:migrate`.

### Linked record details

Displayed record names in the six dashboard lists and relationship sections link to
`/details/<type>/<id>`, where type is `schools`, `contacts`, `employees`, `programs`,
`branches`, or `municipalities`. All six types open full detail
pages; employees have a read-only detail page with assignments, branches led,
participations, and contact history. The employee menu's View Profile action opens
that same detail page. Detail URLs support browser Back and opening in a new tab.

Use `RecordLink` from `components/records/record-link.tsx` for new record references.
It disables automatic prefetching to avoid querying every linked record in large tables.
Selection controls and editable text inputs keep their normal form behavior.

### Teacher/contact program participation

The `ParticipationContacts` join model links a contact to a specific `Participation`
(program occurrence at a school). Its composite key prevents duplicate attendance links.
This is separate from `ParticipationEmployees` (staff working on an occurrence) and from
`Interaction` (communication history). Primary school and employment history are unchanged.

Contacts → View details → Program participations shows the linked program, occurrence,
school, dates, and derived lifecycle status. Edit allows adding links, changing a link to
another occurrence, and removing a link with confirmation. Link removals retain the
participation and other attendees. Deleting a participation removes its contact links
along with employee links in the same transaction.

Apply the prepared `20261104T1804_contact_program_participation` migration before using it:

```bash
npm run db:migrations:check
npm run db:migrate:preview
npm run db:migrate
```

No attendance is inferred from contact history or current employment. The disposable
PostgreSQL test suite checks duplicate adds, changes, invalid-target rollback, contact
scoping, and preservation of other attendees and participation records.

School, contact, branch, program, and municipality Add buttons navigate to
`/create/<type>`. Details and relationship editing are rendered directly on their
`/details/<type>/<id>` pages. Delete buttons navigate to
`/details/<type>/<id>/delete`, which requires typing `delete` before submission.
These flows do not use modal dialogs.

### Automatic cleanup when deleting records

Apply `20261105T1611_automatic_delete_links` before using the updated delete behavior:

```bash
npm run db:migrations:check
npm run db:migrate:preview
npm run db:migrate
```

Deleting a main record no longer requires manually removing its relationships first.
Other schools, contacts, employees, programs, branches, and municipalities are preserved.
The database performs cleanup atomically through foreign-key delete actions:

- Branch: clear school/contact branch references and remove branch-scoped assignments.
- School: clear primary-school, employment-school, participation-school, and interaction-school references.
- Program: clear participation/history program references and remove sponsor/program-assignment links.
- Employee: clear chief, last-contacted-by, and interaction-employee references; remove employee assignment/participation links.
- Contact: preserve communication history with its contact reference cleared; remove its employment and attendance link records.
- Municipality: remove sponsorship links while keeping sponsored programs.

Deleting a participation removes its employee/contact join rows. A scoped assignment is
removed when its branch or program is deleted, rather than becoming a global role.
Missing references display as unassigned/deleted, and can be assigned again in editing.
No other main records are cascaded away. Earlier descriptions of manual unlinking are
superseded by this migration. The migration does not itself delete any main records.

Local verification:

```bash
MIGRATION_TEST_PORT=55439 node --test tests/migrations/automatic-delete-links.mjs
```
