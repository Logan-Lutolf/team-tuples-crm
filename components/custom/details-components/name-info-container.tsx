"use server"

import { decrypt } from "@/app/login/sessions"
import { Organization, Person, PersonRoles, PersonWithRole } from "@/app/types"
import { cookies } from "next/headers"
import { OtherInformationCard } from "./other-information-card"
import { PersonNameAndRole } from "./name-info-form"
import { db } from "@/prisma/db"

export async function getUserRole() {
    const cookiesStore = await cookies()
    const session = cookiesStore.get('session')?.value
    const payload = await decrypt(session)

    return payload?.userRoles
}


export async function NameInfoContainer({obj} : {obj: Person}) {
    let permission: boolean = false
    const userRoles = await getUserRole()
    if (userRoles != undefined) {
        if (userRoles.includes("ADMIN")) permission = true // will add more roles here in the future
    }
    console.log(userRoles)
    console.log(permission)

    
    const roles: PersonRoles[] = await db.orm.public.PersonRoles.where({personId: obj.id}).all()
    const person: PersonWithRole = {...obj, personRole: roles}
    

    return (
        <PersonNameAndRole person={person} editPermission={permission} />
    )
}

export async function OrgNameInfoContainer({obj} : {obj: Person}) {
    let permission: boolean = false
    const userRoles = await getUserRole()
    if (userRoles != undefined) {
        if (userRoles.includes("ADMIN")) permission = true // will add more roles here in the future
    }
    console.log(userRoles)
    console.log(permission)

    
    const roles: PersonRoles[] = await db.orm.public.PersonRoles.where({personId: obj.id}).all()
    const person: PersonWithRole = {...obj, personRole: roles}
    

    return (
        <PersonNameAndRole person={person} editPermission={permission} />
    )
}
