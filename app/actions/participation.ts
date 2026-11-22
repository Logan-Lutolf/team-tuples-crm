"use server"

import { db } from "@/prisma/db";
import z from "zod";
import { refresh } from "next/cache";
import { ProgramTypes, StatusTypes } from "../types";



const studentSchema = z.object({
    name: z.string().min(1),
    dob: z.string(),
    org: z.preprocess(
        v => (v === undefined || v === "" || Number(v) <= 0 ? undefined : Number(v)),
        z.number().int().positive().optional()
    ),
    email: z.email().or(z.literal("")).optional(),
    phone: z.string().optional(),
    guardianEmail: z.string().or(z.literal("")),
    guardianPhone: z.string().or(z.literal(""))
})


const theatreSchema = z.object({
    name: z.string().or(z.literal("")),
    coordinator: z.coerce.number(),
    contact: z.coerce.number(),
    org: z.coerce.number(),
    students: z.array(studentSchema),
    notes: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().or(z.literal("")).optional()
})

export async function addTheatreInstance(formData: FormData) {
    // 1. Parse formData into object using schema
    const rawData = Object.fromEntries(formData)
    
    let students: unknown = []
    try {
        students = JSON.parse(String(rawData.students ?? "[]"))
    } catch {
        return { result: "Error", message: "Invalid students data." }
    }

    const parsed = theatreSchema.safeParse({ ...rawData, students })
    if (!parsed.success) {
        console.log(parsed.error.issues)
        return { result: "Error", message: "Failed to create theatre participation: invalid form data." }
    }


    const { name, coordinator, contact, org, students: studentList, notes, startDate, endDate } = parsed.data
    try {
    // 2. Find necessary entities
        // 2a. Find contact; error if not found
        const contactResult = await db.orm.public.Person.where({id: contact}).first()

        // 2b. Find coordinator; error if not found
        const coordinatorResult = await db.orm.public.Person.where({id: coordinator}).first()

        // 2c. Find organization; error if not found
        const orgResult = await db.orm.public.Organization.where({id: org}).first()

        if (!contactResult || !coordinatorResult || !orgResult) 
            return {result: "Error", message: "Failed to create theatre participation: org, contact, or coordinator not found."}
    
    // 3. Create participation
        const participation = await db.orm.public.Participation.create({
            name: name,
            startDate: startDate,
            endDate: endDate, 
            programType: "MEMORY_OF_NATIONS_THEATRE",
            notes: notes,
            organizationId: orgResult.id
        })

        if (!participation) return {result: "Error", message: "Failed to create theatre participation."}

    // 4. Add coordinator to ParticipationEmployees
        const partEmp = await db.orm.public.ParticipationEmployees.create({
            participationId: participation.id,
            employeeId: coordinatorResult.id
        })

        if (!partEmp) 
            return {result: "Error", message: "Failed to create theatre participation: Adding to ParticipationEmployees table failed."}

    // 5. Add contact to ParticipationContacts
        const partCont = await db.orm.public.ParticipationContacts.create({
            participationId: participation.id,
            personId: contactResult.id
        })

        if (!partCont) 
            return {result: "Error", message: "Failed to create theatre participation: Adding to ParticipationContacts table failed."}

    // 6. Create all students (iterate through array)
        for (const s of studentList) {
            // 6a. Create person
            const person = await db.orm.public.Person.create({
                name: s.name,
                dob: s.dob,
                email: s.email,
                phone: s.phone,
                orgId: s.org
            })

            if (!person) 
                return {result: "Error", message: "Failed to create theatre participation: Error addding student to Person table."}

            // 6b. Create student
            const student = await db.orm.public.Student.create({
                personId: person.id,
                guardianEmail: s.guardianEmail,
                guardianPhone: s.guardianPhone
            })

            if (!student)
                return {result: "Error", message: "Failed to create theatre participation: Error addding student to Student table."}

            // 6c. Add person to ParticipationContacts
            const studentPart = await db.orm.public.ParticipationContacts.create({
                personId: person.id,
                participationId: participation.id
            })
            
            if (!studentPart)
                return {result: "Error", message: "Failed to create theatre participation: Error adding to ParticipationContacts table."}
        }

        refresh()
        return {result: "Success", message: "Theatre instance creation successfull."}
    }
    catch (error) {
        console.log(error)
        return {result: "Error", message: "" + error}
    }
}






const soonSchema = z.object({
    name: z.string().or(z.literal("")),
    coordinator: z.coerce.number(),
    contact: z.coerce.number(),
    org: z.coerce.number(),
    students: z.array(studentSchema),
    notes: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().or(z.literal("")).optional()
})

export async function addSoonInstance(formData: FormData) {

}





// Update those that are involved in a participation
export async function updateParticipationInvolvements(formData: FormData, partId: number) {
    const newOrg = formData.get("org") as string
    // const newContact = formData.get("contact") as string
    // const newCoordinator = formData.get("coordinator") as string

    try {
        const participation = await db.orm.public.Participation.where({id: partId}).update({
            organizationId: Number(newOrg),
        })

        if (participation) {
            refresh()
            return {result: "Success", message: "Participation update successful."}
        }
        else return {result: "Error", message: "Participation update error: Participation not found."}
    }
    catch (error) {
        console.log(error)
        return {result: "Error", message: "" + error}
    }
}


// Update startDate, endDate, and status of participation
export async function updateParticipationOtherInformation(formData: FormData, partId: number) {
    const newStatus = formData.get("status") as string
    const newStartDate = formData.get("startDate") as string
    const newEndDate = formData.get("endDate") as string

    try {
        const participation = await db.orm.public.Participation.where({id: partId}).update({
            status: newStatus as StatusTypes,
            startDate: newStartDate,
            endDate: newEndDate
        })

        if (participation) {
            refresh()
            return {result: "Success", message: "Participation update successful."}
        }
        else return {result: "Error", message: "Participation update error: Participation not found."}
    }
    catch (error) {
        console.log(error)
        return {result: "Error", message: "" + error}
    }
}



export async function updateParticipationNotes(formData: FormData, partId: number) {
    const notes = formData.get("notes") as string

    try {
        const participation = await db.orm.public.Participation.where({id: partId}).update({
            notes: notes
        })

        if (participation) {
            refresh()
            return {result: "Success", message: "Participation update successful."}
        }
        else return {result: "Error", message: "Participation update error: Participation not found."}
    }
    catch (error) {
        console.log(error)
        return {result: "Error", message: "" + error}
    }
}


export async function updateParticipationNameAndType(formData: FormData, partId: number) {
    // const type = formData.get("type") as ProgramTypes
    const name = formData.get("name") as string

    try {
        const participation = await db.orm.public.Participation.where({id: partId}).update({
            // programType: type,
            name: name
        })

        if (participation) {
            refresh()
            return {result: "Success", message: "Participation update successful."}
        }
        else return {result: "Error", message: "Participation update error: Participation not found."}
    }
    catch (error) {
        console.log(error)
        return {result: "Error", message: "" + error}
    }
}



