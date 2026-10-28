import { db } from "@/prisma/db";
import { SchoolTable } from "./school-table"
import type { ComponentProps } from "react"

interface SchoolTableContainerProps {
    query: string,
    page: number
}

export async function SchoolTableContainer({query, page} : SchoolTableContainerProps) {
    const [schools, branches, programs, contacts, employees, assignments, participations] = await Promise.all([
        db.orm.public.School.all().toArray(),
        db.orm.public.Branch.all().toArray(),
        db.orm.public.Program.all().toArray(),
        db.orm.public.Contact.all().toArray(),
        db.orm.public.Employee.all().toArray(),
        db.orm.public.SchoolEmployees.all().toArray(),
        db.orm.public.Participation.all().toArray(),
    ])

    const recordsPerPage = 20
    const currentPage = Number.isSafeInteger(page) && page > 0 ? page : 1
    const filteredSchools = schools
        .filter((school) => school.name.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => a.id - b.id)
        .slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage)

    const relationsBySchool: ComponentProps<typeof SchoolTable>["relationsBySchool"] = {}
    const employeesById = new Map(employees.map((employee) => [employee.id, employee]))

    for (const school of filteredSchools) {
        relationsBySchool[school.id] = {
            contacts: contacts.filter((contact) => contact.schoolId === school.id)
                .map(({ id, name }) => ({ id, name })),
            employees: assignments.filter((assignment) => assignment.schoolId === school.id)
                .flatMap((assignment) => {
                    const employee = employeesById.get(assignment.employeeId)
                    return employee ? [{ id: employee.id, name: employee.name }] : []
                }),
            participations: participations.filter((participation) => participation.schoolId === school.id)
                .map(({ id, programId, startDate, endDate, status }) => ({
                    id, programId, startDate, endDate, status,
                })),
        }
    }

    return (
        <SchoolTable
            data={filteredSchools}
            branches={branches.map(({ id, name }) => ({ id, name }))}
            programs={programs.map(({ id, name }) => ({ id, name }))}
            availableContacts={contacts.filter((contact) => contact.schoolId === null)
                .map(({ id, name }) => ({ id, name }))}
            availableEmployees={employees.map(({ id, name }) => ({ id, name }))}
            relationsBySchool={relationsBySchool}
        />
    )
}
