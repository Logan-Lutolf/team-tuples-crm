import { db } from "@/prisma/db";
import { columns } from "./table/columns"
import { columns as skeletonColumns} from "@/components/custom/loading/loading-columns" 
import { DataTable } from "@/components/ui/data-table";
import { LoadingDataTable } from "@/components/custom/loading/loading-data-table";

interface EmployeeTableContainerProps {
    search?: string | undefined
    cursor?: string | undefined
    dir?: "next" | "prev"
}

export async function EmployeeTableContainer({search, cursor, dir} : EmployeeTableContainerProps) {
    const baseEmployees = await db.orm.public.Employee
        .all()


    const assignments = await db.orm.public.EmployeeAssignment.all().toArray()
    const employees = baseEmployees.map(employee => ({ ...employee,
        role: [...new Set(assignments.filter(a => a.employeeId === employee.id).map(a => a.role))].join(", "),
        globalRoles: assignments.filter(a => a.employeeId === employee.id && a.branchId === null && a.programId === null && a.region === null).map(a => a.role),
    })).filter((e) => {
        return e.name.toLowerCase().includes(search?.toLowerCase() ?? "")
    })

    return (
        <>
            <DataTable columns={columns} data={employees} />
        </>
        
    )
}
