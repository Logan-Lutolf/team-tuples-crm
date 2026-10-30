import "dotenv/config";
import { faker } from "@faker-js/faker";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../prisma/contract.d";
import contractJson from "../prisma/contract.json" with { type: "json" };

// npm run seed loads .env.local before this standalone script starts.
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL must be set before running the seed.");
const db = postgres<Contract>({ contractJson, url });
const enums = db.enums.public;
const address = () => ({
  street: faker.location.streetAddress(),
  city: faker.location.city(),
  zipCode: faker.location.zipCode(),
});
const now = Date.now();
const date = (days: number) => new Date(now + days * 86_400_000).toISOString();

try {
  await db.connect();
  // Roll back cleanup and inserts together if any record fails.
  await db.transaction(async (tx) => {
    const orm = tx.orm.public;
    const runId = faker.string.uuid();
    const existingSchools = await orm.School.all().toArray();
    const schoolsWithoutPhone = existingSchools
      .filter((school) => !school.phone?.trim())
      .map((school) => school.id);

    if (schoolsWithoutPhone.length) {
      const participations = await orm.Participation
        .where((participation) => participation.schoolId.in(schoolsWithoutPhone))
        .select("id").all().toArray();
      const participationIds = participations.map((participation) => participation.id);
      if (participationIds.length) {
        await orm.ParticipationEmployees
          .where((assignment) => assignment.participationId.in(participationIds)).deleteAndCount();
      }
      await orm.Participation
        .where((participation) => participation.schoolId.in(schoolsWithoutPhone)).deleteAndCount();
      await orm.SchoolEmployees
        .where((assignment) => assignment.schoolId.in(schoolsWithoutPhone)).deleteAndCount();
      // Keep contacts available to assign to another school.
      await orm.Contact.where((contact) => contact.schoolId.in(schoolsWithoutPhone))
        .updateAndCount({ schoolId: null });
      await orm.School.where((school) => school.id.in(schoolsWithoutPhone)).deleteAndCount();
    }
    // School IDs are required because School has no auto-increment default.
    const firstSchoolId = existingSchools.reduce((max, s) => Math.max(max, s.id), 0) + 1;

    const branches = [];
    for (const name of enums.Branches.values) {
      branches.push(await orm.Branch.create({
        name,
        region: faker.helpers.arrayElement(enums.Region.values),
      }));
    }

    const employees = [];
    for (let i = 0; i < 50; i++) {
      employees.push(await orm.Employee.create({
        name: faker.person.fullName(),
        email: `employee-${runId}-${i}@example.com`,
        phone: faker.phone.number(),
        address: address(),
        region: branches[i % branches.length].region,
        role: faker.helpers.arrayElement(enums.Role.values),
      }));
    }

    const programs = [];
    for (const name of ["Teacher workshop", "School seminar", "Veterans Day", "Stories of our neighbors"]) {
      programs.push(await orm.Program.create({ name, description: faker.lorem.sentence() }));
    }

    // Add sample program sponsors using both required foreign keys.
    for (let i = 0; i < 3; i++) {
      const municipality = await orm.Municipality.create({
        name: faker.location.city(),
        mayor: faker.person.fullName(),
      });
      await orm.MunicipalityPrograms.create({
        municipalityId: municipality.id,
        programId: programs[i].id,
      });
    }

    for (let i = 0; i < 50; i++) {
      const branch = branches[i % branches.length];
      const employee = employees[i];
      const teammate = employees[(i + 1) % employees.length];
      const school = await orm.School.create({
        id: firstSchoolId + i,
        name: `${faker.company.name()} School`,
        email: `school-${runId}-${i}@example.com`,
        phone: faker.phone.number(),
        address: address(),
        type: faker.helpers.arrayElement(enums.SchoolType.values),
        relationship: faker.helpers.arrayElement(enums.RelationshipType.values),
        region: branch.region,
        branchId: branch.id,
      });

      // School-level contacts are separate from teams for individual programs.
      for (const member of [employee, teammate]) {
        await orm.SchoolEmployees.create({ schoolId: school.id, employeeId: member.id });
      }
      await orm.Contact.create({
        name: faker.person.fullName(),
        email: `contact-${runId}-${i}@example.com`,
        phone: faker.phone.number(),
        address: address(),
        region: branch.region,
        contactRole: "TEACHER",
        branchId: branch.id,
        schoolId: school.id,
        last_contacted: date(-7),
        last_contacted_byId: employee.id,
      });

      // Give every school past, upcoming, ongoing, and cancelled occurrences.
      for (const status of enums.ProgramStatus.values) {
        const completed = status === "COMPLETED";
        const ongoing = status === "ONGOING";
        const participation = await orm.Participation.create({
          schoolId: school.id,
          programId: faker.helpers.arrayElement(programs).id,
          status,
          startDate: date(completed ? -30 : ongoing ? -2 : 14),
          endDate: date(completed ? -29 : ongoing ? 2 : 15),
        });
        for (const member of [employee, teammate]) {
          await orm.ParticipationEmployees.create({
            participationId: participation.id,
            employeeId: member.id,
          });
        }
      }
    }
  });
  console.log("Seed complete: 8 branches, 50 employees, 50 schools, 50 contacts, 4 programs, 200 participations, 3 municipalities, and their relationships.");
} catch (error) {
  console.error("Seed failed; no cleanup or seed inserts were committed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await db.close();
}
