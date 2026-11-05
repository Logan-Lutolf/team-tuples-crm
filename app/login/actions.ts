"use server"

import { db } from "@/prisma/db"
import { and } from "@prisma/orm-postgres/orm-client"
import { createSession, deleteSession } from "./sessions"
import { redirect } from "next/navigation"




export async function login(prevState: any, formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string // Encrypt later in db

    var id = -1

    // Checking that they are not undefined (will change to zod validation later)
    if (!email || !password) {
        console.log("Login failed: Email or password is empty.")
        return
    }

    // Check db for matching email and password
    try {
        const employee = await db.orm.public.Employee
            .where((p) => and((p.email.eq(email), p.password.eq(password))))
            .first()
        
        if (!employee) {
            console.log("Email or password is incorrect.")
            return
        }

        id = employee.id
    }
    catch (error) {
        console.log("Error: ", error)
    }

    await createSession(id)
    redirect("/dashboard")
}

export async function logout() {
    await deleteSession()
    redirect("/login")
}