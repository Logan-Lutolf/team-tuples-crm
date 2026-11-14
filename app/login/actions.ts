"use server"

import { db } from "@/prisma/db"
import { and } from "@prisma/orm-postgres/orm-client"
import { createSession, deleteSession } from "./sessions"
import { redirect } from "next/navigation"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { RoleTypes } from "../types"




export async function login(prevState: any, formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string // Encrypt later in db

    let id = -1
    let roles: RoleTypes = []
    let mustChangePassword

    // Checking that they are not undefined (will change to zod validation later)
    if (!email || !password) {
        console.log("Login failed: Email or password is empty.")
        return "Login failed: Email or password is empty."
    }

    // Check db for matching email and password
    try {
        const person = await db.orm.public.Person.where({ email }).first()
        console.log("person:", person?.id)
        const employee = person
            ? await db.orm.public.Employee.where({ personId: person.id }).first()
            : null
        console.log("employee:", employee?.personId, "pw match:", employee?.password === password)

        if (!person || !employee || employee.password !== password) {
            return "Email or password is incorrect."
        }

        id = person.id
        roles = employee.role
        mustChangePassword = employee.mustChangePassword
    }
    catch (error) {
        console.log("Error: ", error)
        return "Error logging in. Try again later."
    }

    await createSession(id, roles)
    
    if(mustChangePassword) redirect("/otp-page")
    redirect("/dashboard")
}

export async function logout() {
    await deleteSession()
    redirect("/login")
}