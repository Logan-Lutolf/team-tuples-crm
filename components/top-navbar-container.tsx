import { db } from "@/prisma/db";
import { TopNavbar } from "./top-navbar";
import { cookies } from "next/headers";
import { decrypt } from "@/app/login/sessions";
import { Scalars } from "@prisma/orm-postgres/components";
import { Models } from "@/prisma/contract";

type Employee = Scalars<Models.public_Employee>


export async function TopNavbarContainer() {
    let userId = null

    try {
        const cookiesStore = await cookies()
        const session = cookiesStore.get("session")?.value

        const payload = await decrypt(session)
        userId = payload?.userId?? null
    }
    catch (error) {
        console.log("Error reading session cookie or employee not found: ", error)
    }
    
    const employee = await db.orm.public.Employee
        .where({ id: userId })
        .first()

    if (!employee)
        return (
            <div>ERROR</div>
        )

    
    return (
        <TopNavbar employee={employee} />
    )
}