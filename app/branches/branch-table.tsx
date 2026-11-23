import { DataTable } from "@/components/ui/data-table";
import { Branch } from "../types";
import { columns } from "@/components/custom/columns/branch-columns"

export function BranchTable({data}: {data: Branch[]}) {
    return (
        <>
            <DataTable columns={columns} data={data} />
        </>    
    )
}