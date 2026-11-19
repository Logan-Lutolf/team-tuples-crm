import { Participation } from "@/app/types";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "../columns";
import { AddSoonForm } from "../forms/add-soon-form";
import { Search } from "@/components/custom/searches/search";
import { AddTheatreForm } from "../forms/add-theatre-form";



export function TheatreTab({data}: {data: Participation[]}) {
    return (
        <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-row justify-between">
                <div className="w-1/2">
                    <Search placeholder={"Search Theatre Program Participations"} />
                </div>
                
                <AddTheatreForm/>
            </div>
            
            <DataTable columns={columns} data={data}/>
        </div>
    )
}