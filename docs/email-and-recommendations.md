# SmartEmailing, CC tracking and Recommendations: IT handover

These features were ported from `origin/master` (`dc9cb4c`) to `edit-details2`.
They use the existing `Person`, `Organization`, `Employee.personId`, `Employee.role`
and branch-name keys. They do not introduce the obsolete `Contact`/`School` models.

## Pages and permissions

- `/email`: CC tracking address, contact filters, address copying, private saved
  segments, and SmartEmailing list/bounce/engagement filters. Administrators and
  coordinators can use it. The navigation follows the same rule.
- `/recommendations`: the four recommendation cards from master, with school and
  other-organization views. Available to signed-in employees. No external API needed.
- Person details show CC tracking time and imported newsletter history to the same
  employees who can use `/email`.

Access is checked on the server using current `Employee.role` values, not roles in
an old session cookie. Scoped assignments do not grant global email-page access.
This branch has no `MARKETER` role; none was added. Segment actions always use the
logged-in employee's `personId` as owner and reapply contact filters on the server.

Copying addresses does not send email or record an interaction. Subscription and
bounce exclusions are explicit filters, not automatic suppression of copied lists.
Saved segments are fixed snapshots, so they do not acquire later subscription
changes. Send newsletters in SmartEmailing using its current subscription rules.

## Database setup

Only one field is added to an existing model: optional
`Person.lastTrackedEmailAt` (timestamp). Five supporting tables are added:

| Table | Purpose |
| --- | --- |
| `EmailSegment` | Private fixed snapshots, owned by `Employee.personId` |
| `TrackedEmail` | Original message IDs, metadata, and duplicate detection |
| `SmartEmailContact` | Imported list memberships and delivery flags |
| `SmartEmailEvent` | Imported newsletter activity |
| `SmartEmailSync` | Import progress, errors, and worker lease |

Existing person, organization, employee, role, branch and interaction structures
remain in place. No data migration, seed, rename or deletion is required.

The installed Prisma 8 release supports a live schema update. Point `.env.local`
at the intended database, stop the dev server, and review before applying:

```sh
npm run contract:emit
node --env-file-if-exists=.env.local node_modules/prisma/dist/prisma.js db update --dry-run
node --env-file-if-exists=.env.local node_modules/prisma/dist/prisma.js db update
node --env-file-if-exists=.env.local node_modules/prisma/dist/prisma.js db verify
npm run dev
```

For this feature, the preview should contain only five new tables, their indexes,
and the optional timestamp column. The legacy migration graph in this repository
does not describe every schema refactor on this branch; `db update` compares the
live schema with the emitted contract. Do not reset a populated database or use
`db sign` to conceal a mismatch. The schema snapshot and local `db` ref are generated
by Prisma and accompany this change.

The configured development database has already received this additive update.
Its existing imported people and dummy admin account were retained. IT must run
the reviewed update separately for any other deployment/database.

## Configuration

`.env.example` lists settings without real credentials. Keep `.env.local` and
production secrets outside Git. These settings are server-only; never prefix them
with `NEXT_PUBLIC_`.

| Setting | Used by | Source |
| --- | --- | --- |
| `DATABASE_URL`, `SECRET_KEY` | Existing app | Existing deployment |
| `EMAIL_TRACKING_CC_ADDRESS` | CRM | Dedicated mailbox from IT |
| `EMAIL_TRACKING_WEBHOOK_SECRET` | CRM and mailbox connector | Generate a random secret, at least 32 characters |
| `EMAIL_TRACKING_ALLOWED_SENDERS` | CRM | Optional comma-separated shared organization addresses |
| `SMARTEMAILING_USERNAME`, `SMARTEMAILING_API_KEY` | CRM | SmartEmailing API account |
| `SMARTEMAILING_EVENT_STREAM_ID` | CRM | A dedicated SmartEmailing event stream |
| `SMARTEMAILING_SYNC_SECRET` | CRM and scheduler | A different random secret, at least 32 characters |
| `SMARTEMAILING_SYNC_URL` | Scheduler | Deployed HTTPS URL ending `/api/smartemailing/sync` |

For example, generate each integration secret independently with `openssl rand -hex 32`.
Restart/redeploy after setting environment variables.

The pages and contact selection work before external integrations are configured.
The CC address falls back to `crm-tracking@example.invalid` and its copy button is
disabled. Imports have no newsletter data until a successful sync. An unconfigured
integration endpoint returns HTTP 503; an incorrect bearer token returns HTTP 401.

## Connect the CC mailbox

The CRM does not read a mailbox directly. IT needs to create/designate a mailbox
and configure a trusted connector for the actual email service (Microsoft 365,
Google Workspace, or another provider). A CRM user login is not needed by the connector.

For each received message, verify its original sender and send metadata to:

```http
POST https://your-crm-domain/api/email-tracking
Authorization: Bearer <EMAIL_TRACKING_WEBHOOK_SECRET>
Content-Type: application/json
```

```json
{
  "senderVerified": true,
  "messageId": "<original-message-id@example.org>",
  "from": "employee@example.org",
  "to": ["contact@example.org"],
  "cc": ["crm-tracking@example.org"],
  "sentAt": "2026-11-19T10:00:00+01:00"
}
```

`senderVerified` is an assertion from the trusted connector, not permission to
accept arbitrary `From` headers. The mail administrator must establish the
original authenticated sender using their mail system's trusted metadata and
security controls before setting it. Only staff with an `Employee` record or
explicit `EMAIL_TRACKING_ALLOWED_SENDERS` may submit tracked messages.

Use the original message ID and sent timestamp, not forwarding/retry metadata.
The mailbox must actually appear in CC. The body is limited to 64 KB; To and CC
each allow at most 500 valid addresses. Email bodies and attachments are not sent.
The connector must use HTTPS, keep its bearer secret private, and retry temporary
failures with the same message ID and metadata. An identical retry returns
`duplicate: true`; changed metadata for an existing ID returns HTTP 409.

Recipients matching existing `Person.email` values receive `Interaction` rows
with `mode = EMAIL`. The sender and tracking mailbox are excluded. No new people
are created automatically. The original timestamp updates `lastTrackedEmailAt`;
the existing `lastContactedDate` uses the Prague calendar date and
`lastContactedById` uses `Employee.personId`. Older notifications cannot move newer
dates backwards. Allowed shared senders have no employee attribution.

## Configure SmartEmailing imports

Set the four SmartEmailing server settings and arrange a stream containing the
required email activity types: delivered, opened, clicked, unsubscribed, bounced,
and spam complaints. Confirm historical coverage with the account administrator;
the CRM can only import events available in that stream. Use a dedicated stream:
acknowledgment advances its queue and should not compete with another consumer.

The API client uses Basic authentication against SmartEmailing's fixed HTTPS API
origin. It reads lists, contacts and events. The only provider write acknowledges
events already committed to the database. It does not send newsletters, upload
contacts, subscribe people, or change list memberships.

Configure your hosting scheduler to run:

```sh
npm run smartemailing:sync
```

The runner needs `SMARTEMAILING_SYNC_URL` and `SMARTEMAILING_SYNC_SECRET`. If hosted
separately, give the same secret to the CRM server. The runner calls the CRM's
authenticated POST endpoint until the backlog is drained (at most 100 requests).
Run daily initially, or more frequently if faster event updates are required.
Contact memberships refresh once per UTC day; event batches are checked each run.

The endpoint declares a five-minute maximum runtime; each run stops collecting
new pages after roughly 210 seconds. Hosting must allow this duration, and a
large initial import may need multiple requests/runs. The runner exits nonzero
for busy jobs, HTTP errors and incomplete backlogs: monitor scheduler failures
and retry later. The database stores last sync timestamps/error; person history
shows failed/catching-up status while keeping previously imported data.

Pages commit before events are acknowledged. IDs prevent duplicate events on
replay, stored contact offsets resume downloads, and a ten-minute renewable
database lease prevents overlapping workers. Changing a configured stream ID is
refused until IT reviews the saved integration state; do not clear it blindly.

Email matching is case-insensitive and trims whitespace. Changing a person's
email changes which imported newsletter history appears. Newsletter activity
does not create staff interactions or overwrite manual last-contact information.
An unreported open/click is not evidence that a message was unread. Historical
events and saved snapshots currently have no automatic deletion policy; agree
retention and erasure rules with Post Bellum before production rollout.

## Recommendations

The SQL query and thresholds are in `app/dashboard/recommendation-data.ts`:

- Recent contact/participation: 30 days; reconnect after 90 days without contact.
- Up to five results per card and three suggested contacts per organization.
- Schools include primary/secondary schools and organizations with unknown type.
  The other view contains theatre/cultural organizations.
- Membership comes from `Person.orgId`, current `PersonEmployment`, and linked
  participations. Cancelled, future and undated participations do not count as
  evidence of recent activity. Record creation dates are not outreach.
- Suggestions favor teachers, principals and school coordinators, and exclude
  students from organization contact suggestions. Newsletter opens/deliveries
  alone are not personal outreach.

Imported records with unknown activity dates legitimately produce empty cards.
The view selector replaces master's hard-coded account-specific organization view.

## Checks

```sh
npm run test:email
MIGRATION_TEST_PORT=<disposable-local-postgres-port> npm run test:email:integration
```

Integration tests create/drop a uniquely named database on localhost; do not use
the production server. They exercise authentication, private snapshots, CC
deduplication/validation, replay-safe imports, and recommendation queries. Provider
responses are mocked; tests do not send mail or call a real SmartEmailing account.
Parser tests and existing project-wide TypeScript issues are separate from these features.
