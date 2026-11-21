import { db } from "@/prisma/db";
import { SeminarTab } from "../tabs/seminar-tab";
import { Participation } from "@/app/types";



export async function SeminarTabContainer() {
    async function getSoonInstances() {
        try {
            const instances = await db.orm.public.Participation
            .where({programType: "WORKSHOPS"})
            .all().toArray()

            if (instances)
                return instances as Participation[]
            else return [] as Participation[]
        }
        catch (error) {
            console.log(error)
        }
    }

    const data = await getSoonInstances()  // Change this later
    
    return (
        <SeminarTab data={data ?? []}/>
    )
}
