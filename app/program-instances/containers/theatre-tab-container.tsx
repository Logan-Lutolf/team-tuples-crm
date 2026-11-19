import { db } from "@/prisma/db";
import { SoonTab } from "../tabs/soon-tab";
import { Participation } from "@/app/types";
import { TheatreTab } from "../tabs/theatre-tab";



export async function TheatreTabContainer() {
    async function getSoonInstances() {
        try {
            const instances = await db.orm.public.Participation
            .where({programType: "MEMORY_OF_NATIONS_THEATRE"})
            .all().toArray()

            if (instances)
                return instances as Participation[]
            else return [] as Participation[]
        }
        catch (error) {
            console.log(error)
        }
    }

    const data = await getSoonInstances()  // CHANGE THISSSS
    
    return (
        <TheatreTab data={data ?? []}/>
    )
}
