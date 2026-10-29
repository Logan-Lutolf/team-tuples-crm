import { db } from "@/prisma/db";
import { EmployeeTable } from "./employee-table"


interface EmployeeTableContainerProps {
    query: string,
    page: number
}

export async function EmployeeTableContainer({query, page} : EmployeeTableContainerProps) {
    
    const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`
    const employeeQuery = query
        ? db.orm.public.Employee.where((employee) => employee.name.ilike(pattern))
        : db.orm.public.Employee
    const employees = await employeeQuery.all().toArray()

    return (
        <EmployeeTable data={employees}/>
    )
}
