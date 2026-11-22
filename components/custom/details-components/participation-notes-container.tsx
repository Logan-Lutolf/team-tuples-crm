import { Participation } from "@/app/types";
import { getUserRole } from "@/lib/auth";
import { ParticipationNotes } from "./participation-notes";



export async function ParticipationNotesContainer({part}: {part: Participation}) {
    let permission: boolean = false
        const userRoles = await getUserRole()
        if (userRoles != undefined) {
            if (userRoles.includes("ADMIN")) permission = true // will probably add more roles here in the future
        }

    return <ParticipationNotes part={part} editPermission={permission} />
}