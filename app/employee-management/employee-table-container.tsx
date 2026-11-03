import { db } from "@/prisma/db";
import { EmployeeTable } from "./employee-table"
import { columns } from "./table/columns"
import { DataTable } from "@/components/ui/data-table";

interface EmployeeTableContainerProps {
    search?: string | undefined
    cursor?: string | undefined
    dir?: "next" | "prev"
}

export async function EmployeeTableContainer({search, cursor, dir} : EmployeeTableContainerProps) {
    const NUM_RECORDS = 20
    
    const baseEmployees = await db.orm.public.Employee
        .limit(NUM_RECORDS)
        .all()


    const employees = baseEmployees.filter((e) => {
        return e.name.toLowerCase().includes(search?.toLowerCase() ?? "")
    })

    return (
        <>
            <DataTable columns={columns} data={employees} />
        </>
        
    )
}
