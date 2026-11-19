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
