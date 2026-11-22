"use server"

import { decrypt } from "@/app/login/sessions"
import { Organization, Person } from "@/app/types"
import { cookies } from "next/headers"
import { OtherInformationCard } from "./other-information-card"

export async function getUserRole() {
    const cookiesStore = await cookies()
    const session = cookiesStore.get('session')?.value
    const payload = await decrypt(session)

    return payload?.userRoles
}


export async function OtherInformationCardContainer({obj} : {obj: Person | Organization}) {
    let permission: boolean = false
    const userRoles = await getUserRole()
    if (userRoles != undefined) {
        if (userRoles.includes("ADMIN")) permission = true // will add more roles here in the future
    }


    return (
        <OtherInformationCard obj={obj} editPermissions={permission}/>
    )
}