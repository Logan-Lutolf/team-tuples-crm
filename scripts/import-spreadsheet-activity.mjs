// Uses the original import's ID manifest; no schema changes or mail is sent.
import { readFile, writeFile } from 'node:fs/promises';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson from '../prisma/contract.json' with { type: 'json' };

const [planPath, originalReportPath, outputPath, flag] = process.argv.slice(2);
if (!planPath || !originalReportPath || !outputPath || (flag && flag !== '--apply')) {
    throw Error('Usage: node --env-file-if-exists=.env.local scripts/import-spreadsheet-activity.mjs plan.json original-report.json output.json [--apply]');
}
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const original = JSON.parse(await readFile(originalReportPath, 'utf8'));
if (!original.applied) throw Error('The original contact import must have succeeded first');
const report = { applied: false, assumptions: plan.assumptions, skipped: [...plan.skipped], interactions: [], participations: [], changes: [] };
if (flag !== '--apply') {
    console.log(JSON.stringify({ proposedEmails: plan.emails.length, proposedEvents: plan.events.length, skipped: plan.skipped.length }));
    await writeFile(outputPath, JSON.stringify(report, null, 2), { mode: 0o600 });
    process.exit(0);
}
if (!process.env.DATABASE_URL) throw Error('DATABASE_URL is required');
const db = postgres({ contractJson, url: process.env.DATABASE_URL });
try {
    await db.connect();
    await db.transaction(async tx => {
        const orm = tx.orm.public;
        await tx.query(db.raw.sql`SELECT pg_advisory_xact_lock(hashtext('crm-spreadsheet-activity'))::text AS lock`
            .returnsRow({ lock: { codecId: 'pg/text@1' } }).build());
        const people = await orm.Person.all().toArray();
        const byId = new Map(people.map(p => [p.id, p]));
        const byEmail = new Map();
        for (const person of people) {
            if (person.email) {
                const email = person.email.trim().toLowerCase();
                if (byEmail.has(email)) throw Error('Ambiguous case-insensitive email match');
                byEmail.set(email, person);
            }
        }
        // A manifest from another database must not link activity to unrelated people.
        for (const [key, id] of Object.entries(original.ids.people)) {
            const person = byId.get(id);
            if (!person || `${person.name.trim().toLowerCase()}|${person.dob ?? ''}` !== key) throw Error('Contact manifest does not match this database');
        }
        const touched = new Set();
        for (const email of plan.emails) {
            const person = byEmail.get(email.email);
            if (!person || Date.parse(email.timestamp) > Date.now()) {
                report.skipped.push({ ...email, reason: person ? 'Future email date' : 'No unique existing person with the registration email' });
                continue;
            }
            let row = await orm.Interaction.where({ personId: person.id, mode: 'EMAIL', contactedAt: email.timestamp }).first();
            const created = !row;
            if (!row) row = await orm.Interaction.create({ personId: person.id, organizationId: person.orgId,
                contactedAt: email.timestamp, mode: 'EMAIL', employeeId: null });
            report.interactions.push({ id: row.id, personId: person.id, created, source: email.source });
            touched.add(person.id);
        }
        const programId = original.ids.programs['Příběhy našich sousedů — Beroun'];
        if (!programId || !await orm.Program.where({ id: programId, name: 'Příběhy našich sousedů — Beroun' }).first()) throw Error('Project programme missing or changed');
        for (const event of plan.events) {
            const organizationId = original.ids.organizations[event.schoolKey];
            const org = organizationId ? await orm.Organization.where({ id: organizationId }).first() : null;
            if (!org || org.name.trim().toLowerCase() !== event.schoolKey) throw Error('School manifest mismatch');
            let row = await orm.Participation.where({ name: event.name, organizationId, programId, startDate: event.timestamp }).first();
            const created = !row;
            // Source dates establish a schedule; they do not prove that attendance occurred.
            if (!row) row = await orm.Participation.create({ name: event.name, organizationId, programId,
                startDate: event.timestamp, endDate: event.timestamp, status: 'PLANNED', programType: 'STORIES_OF_OUR_NEIGHBORS' });
            const links = [];
            for (const key of event.people) {
                const personId = original.ids.people[key];
                if (!personId) throw Error(`Person missing from original import: ${key}`);
                const exists = await orm.ParticipationContacts.where({ personId, participationId: row.id }).first();
                if (!exists) await orm.ParticipationContacts.create({ personId, participationId: row.id });
                links.push({ personId, created: !exists });
            }
            report.participations.push({ id: row.id, created, source: event.source, links });
        }
        for (const id of touched) {
            const person = byId.get(id);
            const latest = await orm.Interaction.where({ personId: id }).orderBy([r => r.contactedAt.desc(), r => r.id.desc()]).first();
            const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(latest.contactedAt));
            if (!person.lastContactedDate || date > person.lastContactedDate) {
                report.changes.push({ personId: id, before: { lastContactedDate: person.lastContactedDate, lastContactedById: person.lastContactedById }, after: { lastContactedDate: date, lastContactedById: latest.employeeId } });
                await orm.Person.where({ id }).update({ lastContactedDate: date, lastContactedById: latest.employeeId });
            }
        }
        // Preserve the exact mutation manifest before committing; it is needed for review/undo.
        await writeFile(outputPath, JSON.stringify(report, null, 2), { mode: 0o600 });
    });
    report.applied = true;
    await writeFile(outputPath, JSON.stringify(report, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ createdInteractions: report.interactions.filter(r => r.created).length,
        createdParticipations: report.participations.filter(r => r.created).length, skipped: report.skipped.length, report: outputPath }));
} finally { await db.close(); }
