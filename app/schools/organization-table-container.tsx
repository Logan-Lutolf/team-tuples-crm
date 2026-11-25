import { getAllOrganizations } from "../actions/organization"
import { OrganizationTable } from "./organization-table"

export async function OrganizationTableContainer({query}: {query: string}) {

    
    const data = await getAllOrganizations()
    if (!data) return <>Failed to fetch data from database.</>
    
    return (
        <OrganizationTable data={data}/>
    )
}