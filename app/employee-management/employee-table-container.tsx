import { db } from "@/prisma/db";
import { columns } from "./table/columns";
import { DataTable } from "@/components/ui/data-table";
import type { EmployeePerson } from "../types";

interface EmployeeTableContainerProps {
    search?: string
    cursor?: string
    dir?: "next" | "prev"
}

export async function EmployeeTableContainer({ search }: EmployeeTableContainerProps) {
    const records = await db.orm.public.Employee.all().toArray()
    const assignments = await db.orm.public.EmployeeAssignment.all().toArray()
    const query = search?.toLowerCase() ?? ""

    const employees: EmployeePerson[] = records
        .filter(employee => employee.name.toLowerCase().includes(query))
        .map(employee => {
            const mine = assignments.filter(assignment => assignment.employeeId === employee.id)
            return {
                person: { id: employee.id, name: employee.name, email: employee.email, phone: employee.phone },
                employee: {
                    id: employee.id,
                    pfpImgUrl: employee.pfpImgUrl,
                    roles: [...new Set([...employee.roles, ...mine.map(assignment => assignment.role)])],
                },
            }
        })

    return <DataTable columns={columns} data={employees} />
}
