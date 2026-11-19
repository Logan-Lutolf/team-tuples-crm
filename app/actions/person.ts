"use server"

import { db } from "@/prisma/db"
import { CONTACT_TYPES, ContactTypes } from "../types"
import { refresh } from "next/cache"



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