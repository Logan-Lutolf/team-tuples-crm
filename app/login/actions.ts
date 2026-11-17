"use server"

import { db } from "@/prisma/db"
import { createSession, deleteSession } from "./sessions"
import { redirect } from "next/navigation"
import type { Employee } from "../types"




export async function login(prevState: any, formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string // Encrypt later in db

    let id = -1
    let roles: Employee["roles"] = []

    // Checking that they are not undefined (will change to zod validation later)
    if (!email || !password) {
        console.log("Login failed: Email or password is empty.")
        return "Login failed: Email or password is empty."
    }

    // Check db for matching email and password
    try {
        const employee = await db.orm.public.Employee.where({ email }).first()

        if (!employee || employee.password !== password) {
            return "Email or password is incorrect."
        }

        id = employee.id
        roles = employee.roles
    }
    catch (error) {
        console.log("Error: ", error)
        return "Error logging in. Try again later."
    }

    await createSession(id, roles)
    
    redirect("/dashboard")
}

export async function logout() {
    await deleteSession()
    redirect("/login")
}
