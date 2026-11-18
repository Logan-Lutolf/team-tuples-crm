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