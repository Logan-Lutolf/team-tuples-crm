import { db } from "@/prisma/db";
import { columns } from "./table/columns"
import { columns as skeletonColumns} from "@/components/custom/loading/loading-columns" 
import { DataTable } from "@/components/ui/data-table";
import { LoadingDataTable } from "@/components/custom/loading/loading-data-table";
import { EmployeePerson } from "../types";

interface EmployeeTableContainerProps {
    search?: string | undefined
    cursor?: string | undefined
    dir?: "next" | "prev"
}

export async function EmployeeTableContainer({search, cursor, dir} : EmployeeTableContainerProps) {    
    
    const people = await db.orm.public.Person
        .include("employee")
        .all()
    

    const assignments = await db.orm.public.EmployeeAssignment.all().toArray()

    const query = search?.toLowerCase() ?? ""

    const employees: EmployeePerson[] = people
        .flatMap(({ employee, ...person }) => {
        if (!employee) return [] // skip people who aren't employees

      const mine = assignments.filter((a) => a.employeeId === employee.personId)
      return [{
        person,
        employee,
        role: [...new Set(mine.map((a) => a.role))].join(", "),
        globalRoles: mine
          .filter((a) => a.branchId === null && a.programId === null && a.region === null)
          .map((a) => a.role),
      }]
    })
    .filter((e) => e.person.name.toLowerCase().includes(query))


    return (
        <>
            <DataTable columns={columns} data={employees} />
        </>
        
    )
}
