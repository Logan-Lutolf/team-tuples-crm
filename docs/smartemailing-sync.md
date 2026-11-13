# Read-only SmartEmailing connection

The CRM imports SmartEmailing contacts, list memberships and email events. It never
sends email, adds recipients to lists, or changes subscription preferences. CC
mailbox tracking continues separately for employees’ personal emails.

## IT setup

1. Use Post Bellum’s SmartEmailing account. Obtain the API username and API key
   from **Settings → Data sources → API keys**. Keep credentials in the server’s
   environment settings, never in browser code or Git. No account password is needed.
2. Create **one dedicated event stream** for this CRM. Use the official
   [event-stream guide](https://app.smartemailing.cz/docs/api/v3/guides/event-streams.md).
   The request is `POST https://app.smartemailing.cz/api/v3/event-streams`, HTTP
   Basic authentication with the API username/key, and `Content-Type: application/json`:

   ```json
   {
     "topic": "email",
     "label": "Post Bellum CRM",
     "include": ["contact", "template"],
     "since": "2025-11-01T00:00:00Z"
   }
   ```

   Choose the earliest history date you need before creating the stream, and copy
   its returned `data.id`. Without `since`, only new events are available. The
   first batch can take about five minutes to appear. History is normally limited
   to 20 months; confirm your account’s retention and API access with SmartEmailing.
   Do not share this stream with another consumer, recreate it daily, or reset it
   as part of normal operation. Historical seeks have a provider quota.
3. Generate a separate scheduler secret with `openssl rand -hex 32`. Configure:

   ```dotenv
   SMARTEMAILING_USERNAME="api-user@organization.example"
   SMARTEMAILING_API_KEY="your-api-key"
   SMARTEMAILING_EVENT_STREAM_ID="the-created-stream-id"
   SMARTEMAILING_SYNC_SECRET="paste-the-generated-secret"
   SMARTEMAILING_SYNC_URL="https://your-crm-host/api/smartemailing/sync"
   ```

   The first four values belong on the CRM server. The scheduler needs only the
   sync URL and the same sync secret. `.env.local` works for local development;
   production values belong in the hosting platform’s secret/environment settings.
   Restart/redeploy after changes. `SMARTEMAILING_FROM_EMAIL` and
   `SMARTEMAILING_FROM_NAME` are not used; sender/domain verification is not needed
   for this import. Keep CC tracking settings if mailbox tracking is also used.
4. Apply the additive database migration: `npm run db:migrate:preview`, then
   `npm run db:migrate -- --advance-ref db`. Back up production as usual.
5. Run `npm run smartemailing:sync`. Use Node 24 and a running/deployed CRM. For a
   local server, set the URL to `http://localhost:3000/api/smartemailing/sync`.
   The script repeats bounded requests until the backlog is consumed; rerun if it
   reaches its catch-up limit. Initial history can require several runs.
6. Schedule that command **once daily**, for example 03:00 Europe/Prague, on the
   hosting scheduler or IT’s job runner. Use an absolute working directory and
   the configured Node executable. Make nonzero exits alert IT. The HTTP route
   must be allowed up to 300 seconds; each run works for about 210 seconds plus
   its final request. A scheduler may instead POST directly with
   `Authorization: Bearer <SMARTEMAILING_SYNC_SECRET>` and repeat while `more`
   is true. A route on its own does **not** schedule anything.
7. Test with a contact whose email matches an existing CRM contact. Check lists,
   the latest delivery and engagement in **Contact details → SmartEmailing
   newsletters**. The **Email** page includes newsletter deliveries in its
   last-email filter and shows when the last sync completed. Compare a few real
   examples with SmartEmailing, including an unsubscribe and a bounced address.

## What is stored and displayed

- Matching uses trimmed, case-insensitive email addresses. SmartEmailing contact
  fields do not overwrite CRM teacher records or create CRM contacts automatically.
  A minimal provider mirror (email, provider ID, memberships, bounce/blacklist flags)
  supports matching contacts added to the CRM later.
- Newsletter and automation deliveries, opens, clicks, unsubscribes, bounces and spam
  complaints are stored as separate provider events, not employee interactions.
  Each contact shows its latest delivery, the opens/clicks for that message, latest
  open/click/unsubscribe/bounce dates, current list subscriptions and recent activity
  (latest 50 events). Older imported events still contribute to the summary.
- Current list memberships and bounce flags refresh once per UTC day. Large accounts
  resume a contact scan in pages of 500. A complete scan establishes the current
  membership snapshot; removed contacts stop showing old memberships as current.
- Events use the provider’s timestamp, not the import time. They may arrive out of
  order. “Delivered” means accepted by the recipient’s mail server, not read by a
  human. Opens/clicks can include privacy proxies and bots; device classifications
  are shown in the activity list. An unsubscribe event may affect one list; current
  per-list status is shown separately. If its event predates available history, an
  unsubscribe date is unknown, rather than inferred from a general update date.
- CC timestamps stay unchanged. The last-email filter uses the newer of the last
  CC email and SmartEmailing delivery. No imported history does not mean no prior
  outreach. Dates on contact activity use Prague time; sync timestamps on the Email
  page are ISO UTC.
- Subjects/campaign names are stored, but email bodies, attachments, clicked URLs,
  IP addresses and user agents are not. Included template subjects reflect the
  provider’s current template, before personalization. Access follows the Email
  page’s administrator/coordinator/marketer permission. Keep imports/backups under
  Post Bellum’s data retention policy; provider deletions do not erase CRM history
  automatically. For an erasure request, IT must remove the provider mirror and
  stored events for that email as well as any CRM record under its usual procedure.

## Reliability and troubleshooting

A sync reads `GET /contacts`, `GET /contactlists` and the configured event stream.
The only recurring provider POST is `/event-streams/{id}/ack`: it acknowledges a
batch **after** it is committed locally. This advances the queue; it does not send
emails or edit contacts/campaigns. The API key must permit stream consumption and
acknowledgement, so a strictly GET-only key is insufficient. Use a dedicated key;
if your account supports permissions, restrict it to the required API operations.

Events have a unique provider event ID. Failed acknowledgement can be retried
without duplicate events. Database leases prevent simultaneous imports; a crashed
worker’s lease expires after ten minutes. Switching stream IDs is refused to avoid
mixing accounts/history—IT must review and migrate/reset the integration state
explicitly for an account change. Do not casually delete the state row.

HTTP 401 means the scheduler secret is wrong; 503 means configuration is incomplete;
502 means the provider/database sync failed. Provider 401/402/429 usually mean API
credentials, account licensing or rate limits need attention. Retry later; imported
history stays available. A successful response with `more: true` means catch-up is
unfinished. Monitor both contact-sync and event-check timestamps, job failures and
catch-up progress. An empty stream immediately after creation can be normal; run
again after five minutes before treating the initial import as complete.

## Local checks (no real account, no email sent)

Start a disposable local Postgres instance, then run:

```bash
node --test tests/email/contacts.test.mjs
MIGRATION_TEST_PORT=55439 node --test tests/email/smartemailing-sync.mjs
MIGRATION_TEST_PORT=55439 node --test tests/email/segments-and-tracking.mjs
npm run db:migrations:check
```

The integration tests migrate a temporary database and mock all provider HTTP
responses. They cover authentication, list memberships, delivery/engagement,
unsubscribe/bounce details, out-of-order events, ACK retries, concurrency,
resumable contact scans, stale memberships and preservation of CC tracking.
