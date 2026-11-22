import { Participation, ParticipationInfo } from "@/app/types";
import { ParticipationInfoCard, ParticipationOtherInfoCard } from "./participation-information-card";
import { getUserRole } from "@/lib/auth";
import { db } from "@/prisma/db";
import { RecordLink } from "@/components/records/record-link";


export async function ParticipationInfoCardContainer({part} : {part: Participation}) {
    let permission: boolean = false
    const userRoles = await getUserRole()
    if (userRoles != undefined) {
        if (userRoles.includes("ADMIN")) permission = true // will probably add more roles here in the future
    }

    // Assumes only one coordinator is working with a teacher in a participation, so just grab the first
    try {
        const partCoordinator = await db.orm.public.ParticipationEmployees.where({participationId: part.id}).first()
        if (!partCoordinator) return

        const coordinator = await db.orm.public.Person.where({id: partCoordinator.employeeId}).first()

        const partContacts = await db.orm.public.ParticipationContacts.where({participationId: part.id}).all().toArray()
    
        if (!coordinator || !partContacts) return // Make skeleton card here

        const results = await Promise.all(
            partContacts.map((p) =>
                db.orm.public.Person.include("personRole").where({ id: p.personId }).first()
            )
        )

        // Find teacher/main contact (right now its hard coded to teachers)
        let mainContact = null
        const contacts = results.filter((p): p is NonNullable<typeof p> => p !== null)
        if (!contacts) return
        mainContact = contacts.find((c) => c.personRole?.type === "TEACHER") ?? null
        if (!mainContact) return 


        // Find organization name
        const org = await db.orm.public.Organization.where({id: part.organizationId}).first()

        const obj: ParticipationInfo = {
            participation: part,
            coordinator: {id: coordinator.id, name: coordinator.name},
            mainContact: {id: mainContact.id, name: mainContact.name},
            contacts: contacts,
            orgName: org?.name ?? "Unknown Organization"
        }

        return (
            <ParticipationInfoCard obj={obj} editPermissions={permission}/>
        )
    }
    catch (error) {
        console.log(error)
    }
}

export async function ParticipationOtherInfoCardContainer({part} : {part: Participation}) {
    let permission: boolean = false
    const userRoles = await getUserRole()
    if (userRoles != undefined) {
        if (userRoles.includes("ADMIN")) permission = true // will probably add more roles here in the future
    }

    return <ParticipationOtherInfoCard obj={part} editPermissions={permission}/>

}