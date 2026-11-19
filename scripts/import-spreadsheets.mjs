// Prepare a plan with prepare-spreadsheet-import.py first. No writes without --apply.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import postgres from '@prisma/orm-postgres/runtime';
import contractJson from '../prisma/contract.json' with { type: 'json' };

const [planPath, reportPath, flag] = process.argv.slice(2);
if (!planPath || !reportPath || (flag && flag !== '--apply')) {
    throw new Error('Usage: node --env-file-if-exists=.env.local scripts/import-spreadsheets.mjs plan.json report.json [--apply]');
}
const plan = JSON.parse(await readFile(planPath, 'utf8'));
if (plan.version !== 1) throw new Error('Unsupported import plan version');
for (const [personKey, person] of Object.entries(plan.people)) {
    if (!person.name?.trim()) throw new Error(`Missing person name: ${personKey}`);
    if (person.dob && !/^\d{4}-\d{2}-\d{2}$/.test(person.dob)) throw new Error('Invalid normalized birth date');
    if (person.organization && !plan.organizations[person.organization]) throw new Error('Unknown school reference');
}
for (const [person, group] of plan.links) {
    if (!plan.people[person] || !plan.participations[group]) throw new Error('Unknown participation reference');
}
for (const [child, parent] of plan.parentLinks) {
    if (!plan.people[child]?.student || !plan.people[parent]?.parent) throw new Error('Invalid parent/child reference');
}
for (const group of Object.values(plan.participations)) {
    if (!plan.programs[group.program]) throw new Error('Unknown programme reference');
    if (group.organization && !plan.organizations[group.organization]) throw new Error('Unknown group school');
}

const report = {
    applied: false, counts: {}, ids: { people: {}, organizations: {}, programs: {}, participations: {} },
    duplicateRows: plan.duplicateRows, issues: [...plan.issues],
    omittedFields: plan.omittedFields, defaults: plan.defaults,
};
const planned = Object.fromEntries(['people', 'organizations', 'programs', 'participations', 'links', 'parentLinks']
    .map(name => [name, Object.keys(plan[name]).length]));
await mkdir(dirname(reportPath), { recursive: true });
if (flag !== '--apply') {
    await writeFile(reportPath, JSON.stringify({ ...report, planned }, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ applied: false, planned, issues: report.issues.length }));
    process.exit(0);
}

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const db = postgres({ contractJson, url: process.env.DATABASE_URL, poolOptions: { connectionTimeoutMillis: 10_000 } });
const count = model => { report.counts[model] = (report.counts[model] ?? 0) + 1; };
const identity = (name, dob) => JSON.stringify([name.trim().toLocaleLowerCase('cs'), dob ?? null]);

try {
    await db.connect();
    await db.transaction(async tx => {
        const orm = tx.orm.public;
        // Serialize concurrent executions of this importer for the duration of the transaction.
        await tx.query(db.raw.sql`SELECT pg_advisory_xact_lock(hashtext('crm-spreadsheet-import'))::text AS lock`
            .returnsRow({ lock: { codecId: 'pg/text@1' } }).build());
        const [people, organizations, programs, participations, students, parents, roles, links] = await Promise.all([
            orm.Person.all().toArray(), orm.Organization.all().toArray(), orm.Program.all().toArray(),
            orm.Participation.all().toArray(), orm.Student.all().toArray(), orm.Parent.all().toArray(),
            orm.PersonRoles.all().toArray(), orm.ParticipationContacts.all().toArray(),
        ]);
        const personIndex = new Map();
        for (const p of people) {
            const k = identity(p.name, p.dob);
            if (personIndex.has(k)) throw new Error('Ambiguous existing person identity; review before importing');
            personIndex.set(k, p);
        }
        const emailOwners = new Map(people.filter(p => p.email).map(p => [p.email.toLowerCase(), p.id]));
        const orgIndex = new Map(organizations.map(o => [o.name.toLocaleLowerCase('cs'), o]));
        const programIndex = new Map(programs.map(p => [p.name, p]));
        for (const [key, source] of Object.entries(plan.organizations)) {
            let row = orgIndex.get(source.name.toLocaleLowerCase('cs'));
            if (!row) {
                row = await orm.Organization.create({ ...source, relationship: null });
                orgIndex.set(source.name.toLocaleLowerCase('cs'), row);
                count('Organization');
            }
            report.ids.organizations[key] = row.id;
        }
        for (const [key, source] of Object.entries(plan.programs)) {
            let row = programIndex.get(source.name);
            if (!row) {
                row = await orm.Program.create(source);
                programIndex.set(source.name, row);
                count('Program');
            }
            report.ids.programs[key] = row.id;
        }
        const studentIds = new Set(students.map(s => s.personId));
        const parentIds = new Set(parents.map(p => p.personId));
        const roleIndex = new Map(roles.map(r => [r.personId, r.type]));
        for (const [key, source] of Object.entries(plan.people)) {
            const k = identity(source.name, source.dob);
            let row = personIndex.get(k);
            if (!row) {
                let email = source.email || null;
                if (email && emailOwners.has(email)) {
                    report.issues.push({ type: 'email-owned-by-existing-person', person: key, value: email, existingPersonId: emailOwners.get(email) });
                    email = null;
                }
                row = await orm.Person.create({
                    name: source.name, dob: source.dob ?? null, email, phone: source.phone || null,
                    address: source.address ?? null,
                    orgId: source.organization ? report.ids.organizations[source.organization] : null,
                });
                personIndex.set(k, row);
                if (email) emailOwners.set(email, row.id);
                count('Person');
            }
            // Existing people are reused without overwriting their contact information or employee account.
            report.ids.people[key] = row.id;
            if (source.parent && !parentIds.has(row.id)) {
                await orm.Parent.create({ personId: row.id }); parentIds.add(row.id); count('Parent');
            }
            if (source.student && !studentIds.has(row.id)) {
                await orm.Student.create({ personId: row.id }); studentIds.add(row.id); count('Student');
            }
            if (source.role && !roleIndex.has(row.id)) {
                await orm.PersonRoles.create({ personId: row.id, type: source.role });
                roleIndex.set(row.id, source.role); count('PersonRoles');
            } else if (source.role && roleIndex.get(row.id) !== source.role) {
                report.issues.push({ type: 'existing-role-preserved', person: key, requestedRole: source.role });
            }
        }
        const parentByStudent = new Map(students.map(s => [s.personId, s.parentId]));
        for (const [child, parent] of plan.parentLinks) {
            const personId = report.ids.people[child], parentId = report.ids.people[parent];
            const current = parentByStudent.get(personId);
            if (current && current !== parentId) {
                report.issues.push({ type: 'existing-parent-preserved', child, requestedParentId: parentId });
            } else if (current !== parentId) {
                await orm.Student.where({ personId }).update({ parentId }); count('parentLinks');
            }
        }
        for (const [key, source] of Object.entries(plan.participations)) {
            const programId = report.ids.programs[source.program];
            const organizationId = source.organization ? report.ids.organizations[source.organization] : null;
            const matches = participations.filter(p => p.name === source.name && p.programId === programId && p.organizationId === organizationId);
            if (matches.length > 1) throw new Error('Ambiguous existing programme group');
            let row = matches[0];
            if (!row) {
                row = await orm.Participation.create({ name: source.name, programId, organizationId,
                    programType: source.programType, startDate: null, endDate: null });
                participations.push(row); count('Participation');
            }
            report.ids.participations[key] = row.id;
        }
        const linkKeys = new Set(links.map(l => `${l.personId}/${l.participationId}`));
        for (const [person, group] of plan.links) {
            const personId = report.ids.people[person], participationId = report.ids.participations[group];
            const key = `${personId}/${participationId}`;
            if (!linkKeys.has(key)) {
                await orm.ParticipationContacts.create({ personId, participationId });
                linkKeys.add(key); count('ParticipationContacts');
            }
        }
    });
    report.applied = true;
    report.completedAt = new Date().toISOString();
    await writeFile(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ applied: true, created: report.counts, issues: report.issues.length, report: reportPath }));
} finally {
    await db.close();
}
