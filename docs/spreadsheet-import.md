# Spreadsheet import

The two supplied Google Sheets are imported from CSV exports of their selected tabs.
Raw exports, prepared plans, and reports contain personal data and belong under
the Git-ignored `.local/spreadsheet-import/` directory. They are not committed.

```sh
python3 scripts/prepare-spreadsheet-import.py \
  .local/spreadsheet-import/source-1.csv \
  .local/spreadsheet-import/source-2.csv \
  .local/spreadsheet-import/plan.json

# Validate the plan and write a preview without database writes.
node scripts/import-spreadsheets.mjs \
  .local/spreadsheet-import/plan.json .local/spreadsheet-import/preview.json

# Import into DATABASE_URL from .env.local, using one transaction.
node --env-file-if-exists=.env.local scripts/import-spreadsheets.mjs \
  .local/spreadsheet-import/plan.json .local/spreadsheet-import/report.json --apply
```

Before using a different database, emit the contract and preview/apply the nullable
field changes with the installed Prisma 8 CLI:

```sh
npm run contract:emit
node --env-file-if-exists=.env.local node_modules/prisma/dist/prisma.js db update --dry-run
node --env-file-if-exists=.env.local node_modules/prisma/dist/prisma.js db update
node --env-file-if-exists=.env.local node_modules/prisma/dist/prisma.js db verify
```

## Mapping and limitations

- People are matched by normalized name and birth date, not email alone. Review
  the report before importing another dataset: people with the same name and
  unknown birth dates cannot reliably be distinguished by this matching rule.
- Repeated theatre participants become one person, retaining each group link.
- Parents and children remain separate. Shared email addresses are retained on
  parents where possible; other occurrences are left empty and listed in the report.
  Email addresses already held by existing database records are preserved there.
- Missing birth dates remain null. No placeholder birth dates are inserted.
- Schools use source names. Generic or unidentified school descriptions remain
  unresolved; differently spelled school names are not automatically merged.
- Theatre section headings identify groups. Waitlisted people are imported but
  not linked as confirmed attendees. One source participant has no group selection.
- Teachers are contacts, not employee login accounts. Witnesses are people linked
  to their groups; no `HISTORIAN` role is inferred just from being a witness.
- Programme dates, school relationship ratings, regions, and addresses remain
  unknown unless supplied. Partial personal addresses retain source text in the
  available address component, with unknown components null.
- Programme groups retain the schema's default `PLANNED` status because the source
  does not establish their current status. This default is not a source fact.
- Payments, consent, health notes, referral sources, administrative dates, and
  free-text notes have no matching schema fields and are not imported. Reports
  describe the omissions without copying health notes into logs.
- Existing records are reused without overwriting their contact details or roles.
  Review reports for unresolved parent, role, and email conflicts. Concurrent runs
  of this importer serialize on a database advisory lock.

Run the parser tests with:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests/import -v
```

## Historical email and dated project activity

The follow-up activity importer uses the original `report.json` ID manifest, so
it refuses to attach records to a different database or changed person identities.
It creates no people and requires no schema changes.

```sh
python3 scripts/prepare-spreadsheet-activity.py \
  .local/spreadsheet-import/source-1.csv \
  .local/spreadsheet-import/source-2.csv \
  .local/spreadsheet-import/activity-plan.json
node scripts/import-spreadsheet-activity.mjs \
  .local/spreadsheet-import/activity-plan.json \
  .local/spreadsheet-import/report.json \
  .local/spreadsheet-import/activity-preview.json
node --env-file-if-exists=.env.local scripts/import-spreadsheet-activity.mjs \
  .local/spreadsheet-import/activity-plan.json \
  .local/spreadsheet-import/report.json \
  .local/spreadsheet-import/activity-report.json --apply
```

- Theatre confirmation/payment-email dates use 2026, supported by registration
  timestamps. Project dates without years use school year 2026–27, supported by
  the explicit presentation date of 11 March 2027. These are documented assumptions.
- Email entries are `Interaction` rows with mode `EMAIL`. They match the registration
  email to an existing person. Sender attribution is null because the source does
  not identify the sender. These are imported historical records, not verified CC
  messages, so `lastTrackedEmailAt` is unchanged. Existing newer contact dates are kept.
- Source dates have no time. Prague midnight is used for timestamp storage only;
  it does not claim an exact send/event time.
- Exact-dated training, meetings, workshops, recording and presentations become
  separate participations under the existing project programme. Teacher-only
  training links the teacher; team activities link teacher and students; recordings
  and presentations also link the witness. The original nine groups are retained.
- These are **scheduled participations**, not verified attendance. Their status
  stays `PLANNED`; future activities do not become completed interactions. The
  existing recommendation query uses past scheduled participation dates as activity.
- Undated witness calls, ambiguous prose dates and month-only schedules are skipped.
  The coordinator directory contains no dated activity to import.
- Existing matching email interactions and activities are reused on reruns. Each
  report lists original source row/column, database IDs, which rows were created,
  and previous/new contact-date summaries for review or reversal. Keep the first
  report; use a different output filename when verifying a rerun.
