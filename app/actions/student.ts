"use server"

import { db } from "@/prisma/db";
import { refresh } from "next/cache";
import z from "zod";


const studentSchema = z.object({
    name: z.string().min(1),
    dob: z.string(),
    school: z.string(),
})

export async function createStudent(formData: FormData) {
    const parsed = studentSchema.safeParse(studentSchema)
    if (!parsed.success) {
            const fieldErrors = z.flattenError(parsed.error).fieldErrors
            console.log("Form validaiton failed.")
            return { result: "error", message: `Invalid fields: ${Object.keys(fieldErrors).join(", ")}` }
    }
    const {name, dob, school} = parsed.data
    // Create person
    try {
        // Find org id
        let orgId: number
        const org = await db.orm.public.Organization.where({name: school}).first()
        orgId = org?.id?? -1
        if (org == null) return {result: "error", message:"Student creation failed."}

        const person = await db.orm.public.Person.create({
            name: name,
            dob: dob,
            orgId: orgId
        })

        // Create student
        if (person) {
            const student = await db.orm.public.Student.create({
                personId: person.id
            })
            refresh()
            if (student) return {result: "success", message: "Student creation successful."}
        }

        return {result: "error", message:"Student creation failed."}
    }
    catch (error) {
        console.log(error)
        return {result: "error", message:"Student creation failed."}
    }
}


// Written by Claude, modified by Charlotte
export async function searchStudents(query: string) {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []

    // Same pattern as your EmployeeTableContainer: load, then filter in JS.
    // If your ORM supports a case-insensitive "contains" filter, use it instead.
    const records = await db.orm.public.Person.include("personRole").all().toArray()

    return records
        .filter(s => s.name.toLowerCase().includes(q) && s.personRole?.type == "STUDENT")
        .slice(0, 8)
        .map(s => ({ id: s.id, name: s.name }))
}