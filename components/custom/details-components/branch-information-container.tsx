"use server"

import { decrypt } from "@/app/login/sessions"
import { ContactInformationCard } from "./contact-information-card"
import { Branch} from "@/app/types"
import { cookies } from "next/headers"
import { BranchInformationCard } from "./branch-information"

export async function getUserRole() {
    const cookiesStore = await cookies()
    const session = cookiesStore.get('session')?.value
    const payload = await decrypt(session)

    return payload?.userRoles
}


export async function BranchInformationCardContainer({obj} : {obj: Branch}) {
    let permission: boolean = false
    const userRoles = await getUserRole()
    if (userRoles != undefined) {
        if (userRoles.includes("ADMIN")) permission = true
    }
    console.log(userRoles)
    console.log(permission)

    return (
        <BranchInformationCard obj={obj} editPermissions={permission}/>
    )
}