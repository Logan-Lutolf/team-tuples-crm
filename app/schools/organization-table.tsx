import { DataTable } from "@/components/ui/data-table";
import { Organization } from "../types";
import { columns } from "@/components/custom/columns/organization-columns";





export function OrganizationTable({data}: {data: Organization[]}) {
    return <DataTable columns={columns} data={data} />
}