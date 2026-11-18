"use server"

import { decrypt } from "@/app/login/sessions"
import { ContactInformationCard } from "./contact-information-card"
import { Organization, Person } from "@/app/types"
import { cookies } from "next/headers"

export async function getUserRole() {
    const cookiesStore = await cookies()
    const session = cookiesStore.get('session')?.value
    const payload = await decrypt(session)

    return payload?.userRoles
}


export async function ContactInformationCardContainer({obj} : {obj: Person | Organization}) {
    let permission: boolean = false
    const userRoles = await getUserRole()
    if (userRoles != undefined) {
        if (userRoles.includes("ADMIN")) permission = true // will add more roles here in the future
    }
    console.log(userRoles)
    console.log(permission)

    return (
        <ContactInformationCard obj={obj} editPermissions={permission}/>
    )
}