import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract, Models } from "../prisma/contract.d";
import contractJson from "../prisma/contract.json" with { type: "json" };

const files = process.argv.slice(2);
if (files.length !== 3) {
  throw new Error("Supply CSV paths in order: theatre registrations, coordinators, school projects.");
}

const [registrations, coordinators, projects] = JSON.parse(execFileSync("python3", ["-c", `
import csv, json, sys

def rows(path):
    with open(path, encoding="utf-8-sig", newline="") as file:
        return [[value.strip() for value in row] for row in csv.reader(file)]

print(json.dumps([rows(path) for path in sys.argv[1:]]))
`, ...files], { encoding: "utf8" })) as string[][][];

if (!registrations[0]?.[6]?.startsWith("Jméno a příjmení účastníka") ||
    coordinators[0]?.[0] !== "Běh" || projects[1]?.[0] !== "Název školy") {
  throw new Error("CSV headers do not match the three supported spreadsheet tabs.");
}

const sourceEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value.toLowerCase() : undefined;
const placeholderEmail = (kind: string, ...identity: string[]) => {
  const key = createHash("sha256").update(JSON.stringify(identity)).digest("hex").slice(0, 24);
  return `${kind}-${key}@spreadsheet.invalid`;
};

function date(value: string, fallbackYear?: number) {
  const parts = value.match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})?/);
  if (!parts) return undefined;
  const [, day, month, explicitYear] = parts;
  const year = explicitYear ? Number(explicitYear) : fallbackYear;
  if (!year) return undefined;
  const parsed = new Date(Date.UTC(year, Number(month) - 1, Number(day)));
  if (parsed.getUTCDate() === Number(day) && parsed.getUTCMonth() === Number(month) - 1) {
    return parsed.toISOString();
  }
}

function studio(choice = "") {
  if (choice.includes("Palmovkou")) return "Praha 8 – Divadlo pod Palmovkou";
  if (choice.includes("ABC")) return "Praha 1 – Divadlo ABC";
  if (choice.includes("Staromáku") || choice.includes("Dlouhé")) {
    return "Praha 1 – Skautský institut (sloučený ateliér)";
  }
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required.");
const db = postgres<Contract>({ contractJson, url });
const inserted = { programs: 0, schools: 0, contacts: 0, employees: 0, assignments: 0, participations: 0, links: 0 };

try {
  await db.connect();
  await db.transaction(async (tx) => {
    const orm = tx.orm.public;

    async function program(name: string) {
      const existing = await orm.Program.where({ name }).first();
      if (existing) return existing;
      inserted.programs++;
      return orm.Program.create({ name });
    }

    async function participation(programId: number, name: string, startDate: string, schoolId?: number, endDate?: string) {
      const existing = await orm.Participation.where({ programId, name }).first();
      if (existing) return existing;
      inserted.participations++;
      return orm.Participation.create({
        programId, name, startDate, schoolId, endDate,
        status: new Date(startDate) > new Date() ? "PLANNED" : "ONGOING",
      });
    }

    async function contact(name: string, email: string | undefined, phone: string,
      contactRole: Models.public_Contact["contactRole"], identity: string[], schoolId?: number) {
      // Preserve a distinct record when a household shares an email address.
      const byEmail = email ? await orm.Contact.where({ email }).first() : undefined;
      if (byEmail?.name.toLowerCase() === name.toLowerCase()) return byEmail;
      const key = !byEmail && email ? email : placeholderEmail("contact", contactRole, name, ...identity);
      const existing = await orm.Contact.where({ email: key }).first();
      if (existing) return existing;
      inserted.contacts++;
      return orm.Contact.create({ name, email: key, phone: phone || undefined, contactRole, schoolId });
    }

    async function link(participationId: number, contactId: number) {
      if (await orm.ParticipationContacts.where({ participationId, contactId }).first()) return;
      await orm.ParticipationContacts.create({ participationId, contactId });
      inserted.links++;
    }

    const theatre = await program("Divadlo Paměti národa");
    const studioDates = new Map<string, string>();
    for (const row of registrations.slice(1)) {
      const name = studio(row[7]);
      const timestamp = date(row[4]);
      if (!row[6] || !name || !timestamp || row[7].startsWith("POUZE NÁHRADNÍCI")) continue;
      const earliest = studioDates.get(name);
      if (!earliest || timestamp < earliest) studioDates.set(name, timestamp);
    }
    const studios = new Map<string, number>();
    for (const [name, startDate] of studioDates) {
      const occurrence = await participation(theatre.id, `${name} (2026/27)`, startDate);
      studios.set(name, occurrence.id);
    }
    for (const row of registrations.slice(1)) {
      if (!row[6]) continue;
      const student = await contact(row[6], sourceEmail(row[14]), row[13], "STUDENT", ["theatre", row[9]]);
      const parent = row[15]
        ? await contact(row[15], sourceEmail(row[17]), row[16], "OTHER", ["guardian", row[16]])
        : undefined;
      const name = studio(row[7]);
      const occurrence = name && !row[7].startsWith("POUZE NÁHRADNÍCI") ? studios.get(name) : undefined;
      if (occurrence) {
        await link(occurrence, student.id);
        if (parent) await link(occurrence, parent.id);
      }
    }

    const neighbors = await program("Příběhy našich sousedů");
    const coordinatorRole = "STORIES_OF_OUR_NEIGHBORS_COORDINATOR";
    for (const [run, label, phone] of coordinators.slice(1)) {
      if (!run || !label) continue;
      const [primary, alternate] = label.split(" (září ");
      const people = [{ name: primary, phone }, ...(alternate ? [{ name: alternate.replace(/\)$/, ""), phone: "" }] : [])];
      for (const person of people) {
        const email = placeholderEmail("coordinator", person.name);
        const existing = await orm.Employee.where({ email }).first();
        const employee = existing ?? await orm.Employee.create({
          name: person.name, email, phone: person.phone || undefined,
          password: randomBytes(32).toString("hex"), roles: [coordinatorRole],
        });
        if (!existing) inserted.employees++;
        const assignment = { employeeId: employee.id, programId: neighbors.id, role: coordinatorRole } as const;
        if (!await orm.EmployeeAssignment.where(assignment).first()) {
          await orm.EmployeeAssignment.create(assignment);
          inserted.assignments++;
        }
      }
    }

    const schools = await orm.School.all().toArray();
    let nextSchoolId = schools.reduce((max, school) => Math.max(max, school.id), 0) + 1;
    for (const row of projects.slice(2)) {
      if (!row[0]) continue;
      const name = row[0];
      const endDate = date(row[33]);
      // The school training dates omit the year and precede the final presentation.
      const startDate = date(row[8], endDate ? new Date(endDate).getUTCFullYear() - 1 : undefined);
      if (!startDate || !endDate) throw new Error("School project has an invalid training or presentation date.");
      let school = schools.find((item) => item.name.toLowerCase() === name.toLowerCase());
      if (!school) {
        school = await orm.School.create({
          id: nextSchoolId++, name, email: placeholderEmail("school", name),
          type: name.startsWith("Gymnázium") ? "SECONDARY" : "PRIMARY",
          region: "TWO", relationship: "AVERAGE",
          address: { street: "", zipCode: "", country: "Česko", city: name.includes("Králův Dvůr") ? "Králův Dvůr" : "Beroun" },
        });
        schools.push(school);
        inserted.schools++;
      }
      const occurrence = await participation(neighbors.id, name, startDate, school.id, endDate);
      const people = [
        { name: row[4], email: sourceEmail(row[5]), phone: row[6], role: "TEACHER" },
        { name: row[11], email: sourceEmail(row[16]), phone: row[15], role: "OTHER" },
        ...row[2].split(/\r?\n/).map((name) => ({ name: name.trim(), email: undefined, phone: "", role: "STUDENT" as const })),
      ] as const;
      for (const person of people) {
        if (!person.name) continue;
        const record = await contact(person.name, person.email, person.phone, person.role, [name],
          person.role === "OTHER" ? undefined : school.id);
        await link(occurrence.id, record.id);
      }
    }
  });
  console.log("Inserted records", inserted);
} catch (error) {
  // Database errors may contain values from a spreadsheet.
  const details = error as { name?: string; code?: string; cause?: { code?: string } };
  console.error("Import failed and was rolled back", details.name, details.code ?? details.cause?.code ?? "");
  process.exitCode = 1;
} finally {
  await db.close();
}
