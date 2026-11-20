// adjust to wherever your `db` lives

import { db } from "@/prisma/db"

async function main() {
    // 1. Branch (Organization and Person reference it by name)
    await db.orm.public.Branch.create({
        name: "PRAHA",
        id: 1,
        institute: "Praha Institute",
        region: "PRAHA",
    })

    // 2. Program
    const program = await db.orm.public.Program.create({
        name: "Memory of Nations Theatre",
        description: "Student theatre program",
    })

    // 3. Organizations
    const school = await db.orm.public.Organization.create({
        name: "Gymnázium Praha",
        email: "info@gymnazium-praha.cz",
        phone: "111222333",
        type: "SECONDARY_SCHOOL",
        region: "PRAHA",
        relationship: "EXCELLENT",
        branchName: "PRAHA",
    })

    const theatre = await db.orm.public.Organization.create({
        name: "Divadlo Test",
        type: "THEATRE",
        region: "PRAHA",
        branchName: "PRAHA",
    })

    // 4. People (employee, teacher contact, student)
    const employeePerson = await db.orm.public.Person.create({
        name: "Eva Coordinator",
        email: "eva@example.com",
        phone: "123456789",
        branchName: "PRAHA",
    })

    const teacherPerson = await db.orm.public.Person.create({
        name: "Tomáš Teacher",
        email: "tomas@example.com",
        phone: "987654321",
        orgId: school.id,
        branchName: "PRAHA",
    })

    const studentPerson = await db.orm.public.Person.create({
        name: "Mira Student",
        email: "mira@example.com",
        dob: "2010-05-14",
        orgId: school.id,
        branchName: "PRAHA",
    })

    // 5. Employee / Student / PersonRoles
    await db.orm.public.Employee.create({
        personId: employeePerson.id,
        password: "CHANGE_ME_hash_this", // store a real hash in practice
        pfpImgUrl: "",
        role: ["COORDINATOR"],
    })

    await db.orm.public.Student.create({
        personId: studentPerson.id,
        guardianEmail: "guardian@example.com",
        guardianPhone: "555000111",
    })

    await db.orm.public.PersonRoles.create({
        personId: teacherPerson.id,
        type: "TEACHER",
    })

    await db.orm.public.PersonRoles.create({
        personId: studentPerson.id,
        type: "STUDENT",
    })

    // 6. Participation + links
    const participation = await db.orm.public.Participation.create({
        name: "Theatre 2026",
        startDate: "2026-11-02T00:00:00Z",
        endDate: "2026-11-09T00:00:00Z",
        status: "PLANNED",
        programType: "MEMORY_OF_NATIONS_THEATRE",
        programId: program.id,
        organizationId: theatre.id,
        notes: "Seeded test participation",
    })

    await db.orm.public.ParticipationEmployees.create({
        particpationId: participation.id, // (sic) matches the schema's spelling
        employeeId: employeePerson.id,
    })

    await db.orm.public.ParticipationContacts.create({
        participationId: participation.id,
        personId: teacherPerson.id,
    })

    await db.orm.public.ParticipationContacts.create({
        participationId: participation.id,
        personId: studentPerson.id,
    })

    console.log("Seeding complete.")
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})