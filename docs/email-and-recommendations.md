# SmartEmailing, CC tracking and Recommendations: IT handover

These features were ported from `origin/master` (`dc9cb4c`) to `edit-details2`.
They use the existing `Person`, `Organization`, `Employee.personId`, `Employee.role`
and branch-name keys. They do not introduce the obsolete `Contact`/`School` models.

## Pages and permissions

- `/email`: CC tracking address, contact filters, address copying, private saved
  segments, and SmartEmailing list/bounce/engagement filters. Administrators and
  coordinators can use it. The navigation follows the same rule.
- `/dashboard`: includes the four recommendation cards from master, with school and
  other-organization views. Available to signed-in employees. No external API needed.
  `/recommendations` redirects here to preserve existing bookmarks.
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

All imported mailing lists remain available; no list allowlist has been configured.
Subscription summaries show separate subscribed/unsubscribed list counts, followed
by each list's own status. An unsubscribe date from event history is not attached
to a particular list because the imported event metadata does not establish that link.
Blacklisting is shown separately as account-wide suppression. With All lists selected,
subscription filters mean “at least one list”; mixed contacts can match both filters.
Select a specific mailing list to restrict the subscription filter to that membership.

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
The CC address falls back to `pb-tracker@YOUR-TENANT.onmicrosoft.com` and its copy button is
disabled until a real tenant address and secret are configured. `YOUR-TENANT` is
an example, not a provisioned mailbox. Imports have no newsletter data until a successful sync. An unconfigured
integration endpoint returns HTTP 503; an incorrect bearer token returns HTTP 401.

The **View all emails** button below the CC address opens `/email/tracked`, a
paginated list of all `TrackedEmail` records available to administrators/coordinators.
It shows sender, recipients, original sent time, CRM-recorded time and matched-contact
count, with the original Message-ID available under each sender. It includes messages
from previous tracking mailboxes after a switch. It does not show email bodies,
attachments, manually entered/spreadsheet-imported interactions, or SmartEmailing events.

## Connect the CC mailbox

The CRM receives metadata at its tracking endpoint. The included Microsoft 365
connector (`scripts/sync-cc-mailbox.mjs`) reads a dedicated Inbox through Microsoft
Graph and posts verified messages to that endpoint. IT must create/designate and
authorize the mailbox. A CRM user login and mailbox password are not used by the connector.

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

### Temporary Microsoft 365 mailbox and later cutover

Use a **work/school Microsoft 365 mailbox**, for example
`crm-tracking-test@YOUR-TEST-TENANT.onmicrosoft.com`. The tenant/domain must actually
belong to the team; this is a suggested name, not an account that has been created.
This application-credential implementation does not support a personal Outlook.com
mailbox. A shared mailbox can be used without adding its password to the app.
If a regular test mailbox needs a password, generate one in your password manager.
Keep the mailbox password separate from the app-registration secret and integration secrets.

1. IT creates a dedicated, initially empty mailbox. Keep tracked messages in its
   Inbox until collected: the connector monitors that folder, not all folders.
   Use an address that is also the mailbox's Microsoft user principal name; this
   simple connector does not resolve aliases, distribution lists, or forwarding addresses.
2. Register a single-tenant Entra application. Grant read-only mail access and
   restrict it to the tracking mailbox using the tenant's Exchange application
   access controls. If granting Graph `Mail.Read` application permission, obtain
   admin consent and apply mailbox access restrictions; verify unrelated mailboxes
   cannot be read. `Mail.ReadWrite` is not needed. See Microsoft's
   [permission reference](https://learn.microsoft.com/en-us/graph/permissions-reference).
3. Fill the following settings on the connector host. The CRM server needs the
   same CC address and webhook secret. Nothing is prefixed `NEXT_PUBLIC_`.

```dotenv
EMAIL_TRACKING_CC_ADDRESS="crm-tracking-test@YOUR-TEST-TENANT.onmicrosoft.com"
EMAIL_TRACKING_WEBHOOK_SECRET="<random-secret-at-least-32-characters>"
EMAIL_TRACKING_SYNC_URL="http://localhost:3000/api/email-tracking"
M365_TENANT_ID="<tenant-guid>"
M365_CLIENT_ID="<application-guid>"
M365_CLIENT_SECRET="<application-secret-value-not-its-id>"
M365_VERIFIED_SENDER_SECRET="<different-random-secret-at-least-32-characters>"
EMAIL_TRACKING_STATE_DIRECTORY=".local/cc-tracking"
```

Generate each integration secret separately with `openssl rand -hex 32`. The
Microsoft app uses [OAuth client credentials](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow),
not the mailbox login password. For production, use the deployed HTTPS endpoint.
For local testing, run the connector on a machine that can reach the local CRM.

4. **Before sending test messages**, the email administrator must configure two
   ordered Exchange mail-flow rules for the mailbox: first remove any incoming
   `X-CRM-Verified-Sender` header; then stamp that header with
   `M365_VERIFIED_SENDER_SECRET` only for authenticated internal senders. An arbitrary
   sender-provided marker must never be trusted. After `Connect-ExchangeOnline`,
   the included script creates/updates these rules at priorities 0 and 1:

```powershell
./scripts/configure-cc-mail-rules.ps1 `
  -Mailbox $env:EMAIL_TRACKING_CC_ADDRESS `
  -VerifiedSenderSecret $env:M365_VERIFIED_SENDER_SECRET
```

Use administrator-provided environment variables/secret storage rather than
putting the proof value directly in command history. Review rule ordering,
enabled/enforced state, and the tenant's authenticated-sender protections. Test
that an externally forged header is removed, while an authenticated internal
message is stamped. The script updates mail-flow configuration; it does not
create mailboxes or grant app permissions. Microsoft documents the
[internal-sender condition](https://learn.microsoft.com/en-us/exchange/security-and-compliance/mail-flow-rules/conditions-and-exceptions)
and [header actions](https://learn.microsoft.com/en-us/exchange/security-and-compliance/mail-flow-rules/mail-flow-rule-actions).

This first connector deliberately accepts only those verified internal messages.
External staff accounts in another tenant and forwarded messages are not a safe
substitute. For the temporary test, send from a user in the **same Microsoft 365
tenant** and add that actual sender to `Employee` or `EMAIL_TRACKING_ALLOWED_SENDERS`.
The dummy `admin@example.test` address cannot send a real test email.

5. Restart the CRM with the new address/secret. Run:

```sh
npm run email-tracking:check  # validates configuration syntax; does not test Microsoft access
npm run email-tracking:sync  # reads the mailbox and calls the existing CRM endpoint
```

Send an email to a test contact whose real email exists in `Person.email`, CC the
tracking mailbox, and run the sync. Confirm one interaction appears. Repeat the
sync and confirm no second interaction appears. Also test an invalid bearer secret,
an unapproved sender, and an external message with a forged marker. No real
Microsoft account has been connected or tested by the code-only setup.

The runner requests metadata/header fields only, never bodies or attachments.
It uses Microsoft's [message delta API](https://learn.microsoft.com/en-us/graph/api/message-delta)
to retain progress. A page is checkpointed only after all its valid messages are
accepted by the CRM; retries reuse original Message-IDs. Drafts, messages without
the trusted marker, and messages without the configured address in CC are skipped
and counted. Messages deleted before collection are skipped. CRM authorization
failures, invalid verified metadata, rate limits and network errors stop the job
without advancing that page; fix the cause and rerun. Provider bodies/tokens and
contact metadata are not logged. A Graph 410 may require a full safe replay after
reviewing/removing that mailbox's cursor file.

### Switching to Post Bellum's mailbox

No source-code, database, endpoint or existing-history changes are needed:

1. Pause the connector scheduler. Provision/authorize the new mailbox and update
   the two mail-flow rules for it. Test sender verification there as above.
2. Change `EMAIL_TRACKING_CC_ADDRESS` on **both** CRM and connector, then
   restart/redeploy them. This same setting controls the displayed CC address,
   endpoint validation, and the mailbox Graph reads. The URL and webhook secret
   can stay unchanged. If the Microsoft tenant/app changes, update those three
   Microsoft credential settings too.
3. Run a test and resume the schedule. The connector automatically uses a different
   cursor for the new mailbox/account/CRM combination; old cursor/history are retained.

Changing only the UI address cannot grant access to a new mailbox. Microsoft app
permissions and the transport-rule recipient must be configured as part of a
cutover. Old-address messages not drained before cutover will no longer be collected.

### Scheduling and state

The teammate managing hosting should schedule `npm run email-tracking:sync` every
minute or at the agreed interval. The command uses Node 24 (matching the existing
TypeScript scripts), exits nonzero on failure, and stops after 100 pages per run;
an incomplete backlog requires another run. Monitor exit status and skipped-message
counts, particularly `unverifiedSender`, which can indicate missing mail-flow rules.

Keep `EMAIL_TRACKING_STATE_DIRECTORY` on persistent private storage outside public
web hosting. Do not use ephemeral serverless storage for this worker. Tokens stay
in memory; cursor files contain provider continuation URLs and are private (0600).
Local locks prevent overlapping jobs sharing that directory. Use one worker and
one persistent directory per connector; separate hosts must not run independent
copies against the same mailbox. If the worker crashes, inspect the `.lock` file
and confirm no job is running before removing it. Do not automatically delete locks
by age while a long import may still be active. Do not delete cursor state during
normal mailbox switches. Deleted state causes an Inbox replay, which the CRM deduplicates.

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
