import { db } from "@/prisma/db";
import { SmallContactTable } from "./small-contact-table"




interface SmallContactTableContainerProps {
    employeeId: number
}


// Make a standardized version of this T_T
// Stop being lazyyyy lmao
export async function SmallContactTableContainer({ employeeId } : SmallContactTableContainerProps) {
    
    async function getContactsByEmployee(employeeId: number) {
        return (
            await db.orm.public.Contact
                .where({last_contacted_byId: employeeId})
                .all()
        )
    };
    
    const contacts = await getContactsByEmployee(employeeId)

    return (
        <SmallContactTable data={contacts}/>
    )
}