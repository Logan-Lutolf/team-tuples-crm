"use server"

import { decrypt } from "@/app/login/sessions"
import { cookies } from "next/headers"


export async function getUserRole() {
    const cookiesStore = await cookies()
    const session = cookiesStore.get('session')?.value
    const payload = await decrypt(session)

    return payload?.userRoles
}

export async function canEdit() {
    const userRoles = await getUserRole()
    if (userRoles?.includes("ADMIN")) return true
    else return false
}