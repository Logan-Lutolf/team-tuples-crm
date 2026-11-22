This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### SmartEmailing, CC tracking, and Recommendations

The navigation links open `/email` and `/recommendations`. These features use this
branch's `Person`/`Organization` schema. Setup, permissions, mailbox payloads, and
scheduled imports are documented in [the IT handover guide](docs/email-and-recommendations.md).
The [change report](docs/email-feature-changes.md) includes before/after code and a full patch.

### Branch and interaction schema migration

The migration `20261103T1944_branch_and_interaction_updates` is already prepared.
Do not run `migration plan` again for these changes.

It creates `EmployeeAssignment` and `Interaction`, adds optional branch institute/chief
fields, and adds a required participation name. Existing employee roles and regions
are copied into assignments before `Employee.role` is dropped. Branch/program scopes
remain null because the old data did not record them. Existing participations receive
editable names of the form `Participation #<id>`.

School contact history is recorded in `Interaction`. Obsolete school–employee
assignments have been removed from the active schema by a later migration. Existing
contact last-contacted summaries remain unchanged; future interaction writes maintain
these summaries in application code.

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


### Admin edit history

Admins can open **Edit history** from the dashboard and filter by record type and
name. Entries show the old and new values, Prague time, and the editor. The log
covers program instances, programs, branches, municipalities, organizations,
and employees, plus staff, contact, and program links edited with those records.
Passwords are redacted. Automatically maintained timestamps are omitted.
History starts when the SQL is installed. Writes from outside an app session
are attributed to the PostgreSQL login used to make them.

Apply [scripts/install-audit-log.sql](scripts/install-audit-log.sql) before
deploying the feature, using the database owner or the same schema-owning role
the app uses. The script is repeatable and keeps existing new-format audit
entries. It uses a separate `crm_audit` schema and leaves the Prisma contract
unchanged. If the app uses a different database role, grant it schema
`USAGE` and table `SELECT` and `INSERT` on `crm_audit.record_edit`.
Keep that schema outside any public API exposure. Use a direct or session-pooled
PostgreSQL connection for the app because attribution follows its database
connection. No new environment variables are needed.

For the integration test, initialize a fresh local PostgreSQL database named
`crm_audit_test` with the current Prisma contract and apply the audit SQL there.
With `DATABASE_URL` pointing to that database on `127.0.0.1`, run
`node --test tests/audit/record-edit.integration.mjs`.
