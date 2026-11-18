import { DataTable } from "@/components/ui/data-table";
import { studentColumns } from "../columns";



export async function StudentListContainer() {
    return (
        <>
            <DataTable columns={studentColumns} data={[]} paginationEnabled={false} />
        </>
    )
}