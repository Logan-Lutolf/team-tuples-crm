import { DataTable } from "@/components/ui/data-table";
import { PersonWithRole } from "../types";
import { columns } from "@/components/custom/columns/contact-columns"





export function NewContactTable({data}: {data: PersonWithRole[]}) {
    return (
        <>
            <DataTable columns={columns} data={data} />
        </>
    )
}