import { Models } from "@/prisma/contract"
import { Scalars } from "@prisma/orm-postgres/components"
import { cookies } from "next/headers"
import { decrypt } from "../login/sessions"
import { redirect } from "next/navigation"
import { AdminDashboardContainer } from "./containers/admin-dashboard-container"



type Roles = Scalars<Models.public_Employee>["roles"]

export default async function Dashboard() {
    console.log("Dashboard rendering.")
    let roles: Roles | null = null

    try {
        const cookiesStore = await cookies()
        const session = cookiesStore.get("session")?.value
        const payload = await decrypt(session)

        roles = payload?.userRoles?? null
    }
    catch (error) {
        console.log("Error reading session cookie: ", error)
    }

    if (!roles) {
        redirect("/login")
    }
        

    return (
        <>
            {roles?.includes("ADMIN") && <AdminDashboardContainer/>}
        </>
    )
}