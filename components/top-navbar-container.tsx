import { db } from "@/prisma/db";
import { TopNavbar } from "./top-navbar";
import { cookies } from "next/headers";
import { decrypt } from "@/app/login/sessions";




export async function TopNavbarContainer() {
    let userId = null

    try {
        const cookiesStore = await cookies()
        const session = cookiesStore.get("session")?.value
        console.log("session cookie:", session === undefined ? "undefined" : session.slice(0, 20))

        const payload = await decrypt(session)
        userId = payload?.userId?? null
    }
    catch (error) {
        console.log("Error reading session cookie or employee not found: ", error)
    }
    const employee = userId !== null
        ? await db.orm.public.Employee.where({ personId: userId }).first()
        : null

    const person = await db.orm.public.Person.where({id: userId}).first()

    if (!employee || !person)
        return (
            <></>
        )

    return (
        <TopNavbar person={person} employee={employee} />
    )
}