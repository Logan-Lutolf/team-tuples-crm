// Written by Claude :(
// Running out of time and losing my mind!!!!!


"use server"

import { z } from "zod"
import { db } from "@/prisma/db"
import { refresh } from "next/cache"

type Student = { name: string; dob: string; school: string }

const schema = z.object({
    name: z.string().min(1),
    coordinator: z.string().optional(),
    start: z.string().min(1),
    end: z.string().optional(),
})

export async function createSoonInstance(formData: FormData, students: Student[]) {
    const parsed = schema.safeParse({
        name: formData.get("name"),
        coordinator: formData.get("main-coordinator") || undefined,
        start: formData.get("start"),
        end: formData.get("end") || undefined,
    })
    if (!parsed.success) {
        return { result: "error", message: "Name and start date are required." }
    }

    try {
        // Resolve the school from the first student (a Participation has one organization)
        const org = students[0]
            ? await db.orm.public.Organization.where({ name: students[0].school }).first()
            : null

        // Link to the "Stories of Our Neighbors" program if a Program row exists for it
        const program = await db.orm.public.Program
            .where({ name: "Stories of Our Neighbors" }).first()

        const participation = await db.orm.public.Participation.create({
            name: parsed.data.name,
            startDate: new Date(parsed.data.start).toDateString(),
            endDate: parsed.data.end ? new Date(parsed.data.end).toDateString() : null,
            programType: "STORIES_OF_OUR_NEIGHBORS",
            organizationId: org?.id ?? null,
            programId: program?.id ?? null,
        })

        // Main coordinator: find a Person by name who is an Employee
        if (parsed.data.coordinator) {
            const coordinator = await db.orm.public.Person
                .where({ name: parsed.data.coordinator }).first()
            const employee = coordinator
                ? await db.orm.public.Employee.where({ personId: coordinator.id }).first()
                : null
            if (employee) {
                await db.orm.public.ParticipationEmployees.create({
                    particpationId: participation.id,   // sic: matches the typo in your schema
                    employeeId: employee.personId,
                })
            }
        }

        // Students
        for (const s of students) {
            const studentOrg = await db.orm.public.Organization.where({ name: s.school }).first()

            const person = await db.orm.public.Person.create({
                name: s.name,
                dob: new Date(s.dob).toDateString(),
                orgId: studentOrg?.id ?? null,
            })

            await db.orm.public.PersonRoles.create({ personId: person.id, type: "STUDENT" })
            await db.orm.public.Student.create({ personId: person.id })
            await db.orm.public.ParticipationContacts.create({
                participationId: participation.id,
                personId: person.id,
            })
        }

        refresh()
        return { result: "success", message: "Participation created." }
    } catch (error) {
        console.log(error)
        return { result: "error", message: "" + error }
    }
}