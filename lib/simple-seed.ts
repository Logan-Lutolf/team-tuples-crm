// Simple seed script. Run on an empty database (re-running will hit unique
// constraints on Branch.id and Person.email).
//
//   npx tsx seed.ts
//
// Adjust the import below to wherever your `db` lives. If tsx can't resolve
// the "@/..." alias, use a relative path like this one.

import { db } from "@/prisma/db"

// One row per BranchTypes value (the enum has 9). Each branch needs a region.
const BRANCHES = [
  { id: 1, name: "PRAHA", region: "PRAHA" },
  { id: 2, name: "SEVERNÍ_ČECHY", region: "ÚSTECKÝ" },
  { id: 3, name: "VÝCHODNÍ_ČECHY", region: "KRÁLOVÉHRADECKÝ" },
  { id: 4, name: "STŘEDNÍ_MORAVA", region: "OLOMOUCKÝ" },
  { id: 5, name: "PLZEŇSKÝ_KRAJ", region: "PLZEŇSKÝ" },
  { id: 6, name: "JIŽNÍ_MORAVA", region: "JIHOMORAVSKÝ" },
  { id: 7, name: "JIŽNÍ_ČECHY", region: "JIHOČESKÝ" },
  { id: 8, name: "KARLOVARSKÝ_KRAJ", region: "KARLOVARSKÝ" },
  { id: 9, name: "MORAVSKOSLEZSKÝ_KRAJ", region: "MORAVSKOSLEZSKÝ" },
] as const

// One school per RegionTypes value (all 14), attached to the closest branch.
const SCHOOLS = [
  { region: "PRAHA", city: "Praha", branch: "PRAHA" },
  { region: "STŘEDOČESKÝ", city: "Kladno", branch: "PRAHA" },
  { region: "JIHOČESKÝ", city: "České Budějovice", branch: "JIŽNÍ_ČECHY" },
  { region: "PLZEŇSKÝ", city: "Plzeň", branch: "PLZEŇSKÝ_KRAJ" },
  { region: "KARLOVARSKÝ", city: "Karlovy Vary", branch: "KARLOVARSKÝ_KRAJ" },
  { region: "ÚSTECKÝ", city: "Ústí nad Labem", branch: "SEVERNÍ_ČECHY" },
  { region: "LIBERECKÝ", city: "Liberec", branch: "SEVERNÍ_ČECHY" },
  { region: "KRÁLOVÉHRADECKÝ", city: "Hradec Králové", branch: "VÝCHODNÍ_ČECHY" },
  { region: "PARDUBICKÝ", city: "Pardubice", branch: "VÝCHODNÍ_ČECHY" },
  { region: "JIHOMORAVSKÝ", city: "Brno", branch: "JIŽNÍ_MORAVA" },
  { region: "OLOMOUCKÝ", city: "Olomouc", branch: "STŘEDNÍ_MORAVA" },
  { region: "ZLÍNSKÝ", city: "Zlín", branch: "STŘEDNÍ_MORAVA" },
  { region: "MORAVSKOSLEZSKÝ", city: "Ostrava", branch: "MORAVSKOSLEZSKÝ_KRAJ" },
  { region: "JIHLAVA", city: "Jihlava", branch: "JIŽNÍ_MORAVA" },
] as const

const PROGRAMS = [
  "Stories of Our Neighbors",
  "Memory of Nations Theatre",
  "Story On",
  "School Network",
  "Education Development",
  "Workshops",
]

const RELATIONSHIPS = ["POOR", "AVERAGE", "EXCELLENT"] as const

async function main() {
  // Branches
  for (const b of BRANCHES) {
    await db.orm.public.Branch.create({
      id: b.id,
      name: b.name,
      region: b.region,
      institute: `${b.name} institute`,
    })
  }
  console.log(`Created ${BRANCHES.length} branches`)

  // Programs
  for (const name of PROGRAMS) {
    await db.orm.public.Program.create({ name, description: `${name} program` })
  }
  console.log(`Created ${PROGRAMS.length} programs`)

  // Schools + one teacher contact each
  for (const [i, s] of SCHOOLS.entries()) {
    const org = await db.orm.public.Organization.create({
      name: `Základní škola ${s.city}`,
      email: `skola.${i + 1}@example.com`,
      phone: `+42060000${String(i + 1).padStart(4, "0")}`,
      type: "PRIMARY_SCHOOL",
      region: s.region,
      relationship: RELATIONSHIPS[i % RELATIONSHIPS.length],
      branchName: s.branch,
    })

    const teacher = await db.orm.public.Person.create({
      name: `Teacher ${s.city}`,
      email: `teacher.${i + 1}@example.com`,
      phone: `+42070000${String(i + 1).padStart(4, "0")}`,
      orgId: org.id,
      branchName: s.branch,
    })

    await db.orm.public.PersonRoles.create({
      personId: teacher.id,
      type: "TEACHER",
    })
  }
  console.log(`Created ${SCHOOLS.length} schools with one teacher each`)

  // One admin employee (Person + Employee)
  const adminPerson = await db.orm.public.Person.create({
    name: "Admin User",
    email: "admin@example.com",
    branchName: "PRAHA",
  })
  await db.orm.public.Employee.create({
    personId: adminPerson.id,
    // Placeholder only: replace with a real hash from whatever library your
    // login uses. This value will not match any password.
    password: process.env.SEED_ADMIN_PASSWORD_HASH ?? "REPLACE_WITH_REAL_HASH",
    pfpImgUrl: "",
    role: ["ADMIN"],
  })
  console.log("Created admin employee")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })