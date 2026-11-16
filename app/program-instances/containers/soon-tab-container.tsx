import { db } from "@/prisma/db";
import { SoonTab } from "../tabs/soon-tab";
import { Participation } from "@/app/types";



export async function SoonTabContainer() {
    async function getSoonInstances() {
        try {
            const instances = await db.orm.public.Participation
            .where({programType: "STORIES_OF_OUR_NEIGHBORS"})
            .all()

            if (instances)
                return instances as Participation[]
            else return [] as Participation[]
        }
        catch (error) {
            console.log(error)
        }
    }

    const data = await getSoonInstances()
    
    return (
        <SoonTab data={data ?? []}/>
    )
}