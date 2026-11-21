import { db } from "@/prisma/db";
import { getContacts } from "../actions/person";
import { Person } from "../types";
import { NewContactTable } from "./new-contact-table";






export async function NewContactTableContainer({query}: {query: string}) {

    
    const data = await getContacts(query)
    if (!data) return <>Failed to fetch data from database.</>
    
    return (
        <NewContactTable data={data}/>
    )
}