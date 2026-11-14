import { Participation } from "@/app/types";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "../columns";



export function SoonTab({data}: {data: Participation[]}) {
    return (
        <div>
            <DataTable columns={columns} data={data}/>
        </div>
    )
}