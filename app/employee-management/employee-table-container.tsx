import { db } from "@/prisma/db";
import { EmployeeTable } from "./employee-table"


interface EmployeeTableContainerProps {
    query: string,
    page: number
}

export async function EmployeeTableContainer({query, page} : EmployeeTableContainerProps) {
    
    async function getEmployees(query: string, page: number) {
        return (await db.orm.public.Employee.all().toArray()).filter((employee) => {
            if (employee.name.toLowerCase().includes(query.toLowerCase())) return employee
        });
    }


    
    const employees = await getEmployees(query, page)

    return (
        <EmployeeTable data={employees}/>
    )
}