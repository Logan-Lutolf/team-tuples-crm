"use server"

import { db } from "@/prisma/db";
import z from "zod";
import { EmployeeDetails } from "../employee-management/employee-details";
import { refresh } from "next/cache";

// const studentSchema = z.object({
//     name: z.string().min(1),
//     dob: z.string(),
//     school: z.string(),
// })

// const soonInstanceSchema = z.object({
//     name: z.string().or(z.literal("")),
//     coordinator: z.string().or(z.literal("")),
//     students: z.array(studentSchema),
//     description: z.string(),
//     startDate: z.string(),
//     endDate: z.string().or(z.literal("")).optional()
// })


// export async function addSOONInstance(formData: FormData) {
//     const parsed = soonInstanceSchema.safeParse(formData)
//     if (!parsed.success) {
//             const fieldErrors = z.flattenError(parsed.error).fieldErrors
//             console.log("Form validaiton failed.")
//             return { result: "error", message: `Invalid fields: ${Object.keys(fieldErrors).join(", ")}` }
//     }
//     const {name, coordinator, students, description, startDate, endDate } = parsed.data



    

    







    // try {
    //     // get employee id
    //     let empId: number = -1
    //     const employee = await db.orm.public.Person.include("employee").where({name: coordinator}).first()
    //     if (employee) empId = employee.id

    //     // Create students if they are not already in db
    //         // Create person
    //         // Create student

    //     // create new participation
    //     let participationId: number = -1
    //     const participation = await db.orm.public.Participation.create({
    //         name: name,
    //         startDate: startDate,
    //         endDate?: endDate,
    //         programType: "STORIES_OF_OUR_NEIGHBORS"
    //     })
    //     if (participation) participationId = participation.id


    //     // add participation and employee to join table
    //     const partEmp = await db.orm.public.ParticipationEmployees.create({
    //         particpationId: participationId,
    //         employeeId: empId
    //     })

    //     // add students to join table
    //     const partContact = await db.orm.public.ParticipationContacts.create({
    //         participationId: participationId,
    //         personId:

    //     })
    // }
    // catch (error) {

    // }



// }



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
    console.log("/////////////////////////////////////////////////////////////\n/////////////////////////////////////////////////////////////\n/////////////////////////////////////////////////////////////")
    console.log(Object.fromEntries(formData))
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
            notes: notes
        })

        if (!participation) return {result: "Error", message: "Failed to create theatre participation."}

    // 4. Add coordinator to ParticipationEmployees
        const partEmp = await db.orm.public.ParticipationEmployees.create({
            particpationId: participation.id,
            employeeId: coordinatorResult.id
        })

        if (!partEmp) 
            return {result: "Error", message: "Failed to create theatre participation: Adding to ParticipationEmployees table failed."}

    // 5. Add contact to ParticipationContacts
        const partCont = await db.orm.public.ParticipationContacts.create({
            participationId: participation.id,
            personId: contactResult.id
        })

        if (!partEmp) 
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













