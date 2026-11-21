"use server"

import { db } from "@/prisma/db"
import { BRANCH_TYPES, CONTACT_TYPES, ContactTypes, Person } from "../types"
import { refresh } from "next/cache"
import z from "zod"



export async function updateNameAndRole(formData: FormData, id: number) {
    const name = formData.get("name") as string
    const role = formData.get("role") as ContactTypes

    try {
        const person = await db.orm.public.Person.where({id: id}).update({
            name: name,
        })

        if (person) {
            const existing = await db.orm.public.PersonRoles.where({ personId: id }).first()
        if (existing) {
            await db.orm.public.PersonRoles.where({ personId: id }).update({ type: role })
        } else {
            await db.orm.public.PersonRoles.create({ personId: id, type: role })
        }
        
        if (existing) {
            refresh()
            return {result: "success", message: "Updated successfully."}
        } else return {result: "error", message: "Person not found."}
        }
    } catch (error) {
        return {result: "error", message: "" + error}
    }
}

// Written by Claude
export async function searchPeople(query: string) {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []

    // Same pattern as your EmployeeTableContainer: load, then filter in JS.
    // If your ORM supports a case-insensitive "contains" filter, use it instead.
    const records = await db.orm.public.Person.include("employee").all().toArray()

    return records
        .filter(p => p.name.toLowerCase().includes(q) && p.employee?.personId == null)
        .slice(0, 8)
        .map(p => ({ id: p.id, name: p.name }))
}


export async function getContacts(query?: string) {
    try {

    
        const pattern = `%${query?.replace(/[\\%_]/g, "\\$&")}%`
        const contactQuery = query
            ? db.orm.public.Person.include("personRole").where((contact) => contact.name.ilike(pattern))
            : db.orm.public.Person.include("personRole")

        const contacts = await contactQuery
            .orderBy([(contact) => contact.updatedAt
            .desc(), (contact) => contact.id.desc()])
            .all().toArray()

        const employees = await db.orm.public.Employee.all().toArray()

        if (!employees) return // return smth?

        const employeeIds = new Set(employees.map((e) => e.personId))

        return contacts
            .filter((p) => !employeeIds.has(p.id))
            .map((p) => ({
                ...p,
                personRole: p.personRole?.type ?? null,
            }))
    }
    catch (error) {
        console.log(error)
    }


}




// add branch and mailing address later
const personSchema = z.object({
    name: z.string().min(1),
    email: z.string().or(z.literal("")).optional(),
    phone: z.string().or(z.literal("")).optional(),
    dob: z.string().or(z.literal("")).optional(),
    org: z.coerce.number().optional(),
    role: z.enum(CONTACT_TYPES).optional()
})


export async function createPerson (formData: FormData){
    const rawData = Object.fromEntries(formData)

    const parsedData = personSchema.safeParse(rawData)
    if (!parsedData.success) return {result: "Error", message: "Failed to create person: parsing error."}

    const {name, email, phone, dob, org, role} = parsedData.data

    try {
        const person = await db.orm.public.Person.create({
            name: name,
            email: email,
            phone: phone,
            dob: dob,
            orgId: org,
        })

        if (!person) return {result: "Error", message: "Failed to create person: Error in Person database call."}

        if (role) {
            const personRole = await db.orm.public.PersonRoles.create({
            personId: person.id,
            type: role
            })

            if (!personRole) return {result: "Error", message: "Failed to create person: Error in PersonRoles database call."}
        
            // Students don't need employment history
            if (role != "STUDENT") {
                const employment = await db.orm.public.PersonEmployment.create({
                    personId: person.id,
                    orgId: org,
                })

                if (!employment)
                    return {result: "Error", message: "Failed to create person: Error in PersonEmployment database call."}
            }
            
            return {result: "Success", message: "Contact creation successful."}
        }
    }
    catch (error) {
        console.log(error)
        return {result: "Error", message: "Failed to create person: " + error}

    }


}



export async function deleteContact(id: number) {
    
}