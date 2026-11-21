import { db } from "@/prisma/db";
import { getContacts } from "../actions/person";
import { Person } from "../types";
import { ContactTable } from "./contact-table";






export async function ContactTableContainer({query}: {query: string}) {

    
    const data = await getContacts(query)
    if (!data) return <>Failed to fetch data from database.</>
    
    return (
        <ContactTable data={data}/>
    )
}