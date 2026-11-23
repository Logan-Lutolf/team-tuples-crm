"use server"

import { db } from "@/prisma/db";
import { refresh } from "next/cache";
import z from "zod";


const studentSchema = z.object({
    name: z.string().min(1),
    dob: z.string(),
    org: z.preprocess(
        v => (v === undefined || v === "" || Number(v) <= 0 ? undefined : Number(v)),
        z.number().int().positive().optional()
    ),
    email: z.email().or(z.literal("")).optional(),
    phone: z.string().or(z.literal("")).optional(),
    guardianEmail: z.string().or(z.literal("")),
    guardianPhone: z.string().or(z.literal(""))
})

export async function createStudent(formData: FormData) {
    // Parse form data into schema
    const parsed = studentSchema.safeParse(formData)
    if (!parsed.success) {
            const fieldErrors = z.flattenError(parsed.error).fieldErrors
            console.log("Form validaiton failed.")
            return { result: "error", message: `Invalid fields: ${Object.keys(fieldErrors).join(", ")}` }
    }

    // Deconstruct data object
    const {  guardianEmail, guardianPhone, ...scalars} = parsed.data
    
    // Create person
    try {

        const person = await db.orm.public.Person.create(scalars)

        // Create student
        if (person) {
            const student = await db.orm.public.Student.create({
                personId: person.id,
                guardianEmail: guardianEmail,
                guardianPhone: guardianPhone
            })
            refresh()
            if (student) return {result: "Success", message: "Student creation successful."}
        }

        return {result: "Error", message:"Student creation failed."}
    }
    catch (error) {
        console.log(error)
        return {result: "Error", message:"Student creation failed: " + error}
    }
}


// Written by Claude, modified by Charlotte
export async function searchStudents(query: string) {
    const q = query.trim()
    if (!q) return []

    const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`

    const people = await db.orm.public.Person
        .include("student")
        .include("organization")
        .where((p) => p.name.ilike(pattern))
        .all()
        .toArray()

    return people
        .filter((p) => p.student != null)   // only people with a Student row
        .slice(0, 10)
        .map((p) => ({
            id: p.id,
            name: p.name,
            dob: p.dob ?? "",
            email: p.email ?? "",
            phone: p.phone ?? "",
            orgId: p.orgId != null ? String(p.orgId) : "",
            orgName: p.organization?.name ?? "",
            guardianEmail: p.student!.guardianEmail,
            guardianPhone: p.student!.guardianPhone,
    }))
}