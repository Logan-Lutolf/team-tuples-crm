import { db } from "@/prisma/db";
import { SchoolTable } from "./school-table"
import type { ComponentProps } from "react"

interface SchoolTableContainerProps {
    query: string,
    page: number
}

export async function SchoolTableContainer({query, page} : SchoolTableContainerProps) {
    // Capture one server timestamp so both sections use the same time during hydration.
    // eslint-disable-next-line react-hooks/purity
    const participationAsOf = Date.now()
    const recordsPerPage = 20
    const currentPage = Number.isSafeInteger(page) && page > 0 ? page : 1
    // Escape LIKE wildcards so searching keeps its literal substring behavior.
    const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`
    const schoolQuery = query
        ? db.orm.public.School.where((school) => school.name.ilike(pattern))
        : db.orm.public.School

    const [filteredSchools, branches, programs, availableContacts, employees] = await Promise.all([
        schoolQuery.orderBy((school) => school.id.desc())
            .offset((currentPage - 1) * recordsPerPage)
            .limit(recordsPerPage).all().toArray(),
        db.orm.public.Branch.select("id", "name").all().toArray(),
        db.orm.public.Program.select("id", "name").all().toArray(),
        db.orm.public.Contact.where({ schoolId: null }).select("id", "name").all().toArray(),
        db.orm.public.Employee.select("id", "name", "email", "phone", "role", "region").all().toArray(),
    ])

    const schoolIds = filteredSchools.map((school) => school.id)
    const [contacts, assignments, participations] = schoolIds.length ? await Promise.all([
        db.orm.public.Contact.where((contact) => contact.schoolId.in(schoolIds))
            .select("id", "name", "schoolId", "email", "phone", "branchRole", "subject").all().toArray(),
        db.orm.public.SchoolEmployees.where((assignment) => assignment.schoolId.in(schoolIds))
            .select("schoolId", "employeeId").all().toArray(),
        db.orm.public.Participation.where((participation) => participation.schoolId.in(schoolIds))
            .select("id", "schoolId", "programId", "startDate", "endDate", "status").all().toArray(),
    ]) : [[], [], []]

    const participationIds = participations.map((participation) => participation.id)
    const participantAssignments = participationIds.length
        ? await db.orm.public.ParticipationEmployees
            .where((assignment) => assignment.participationId.in(participationIds))
            .select("participationId", "employeeId").all().toArray()
        : []

    const relationsBySchool: ComponentProps<typeof SchoolTable>["relationsBySchool"] = {}
    const employeesById = new Map(employees.map((employee) => [employee.id, employee]))
    const participantsByParticipation = new Map<number, typeof employees>()
    for (const assignment of participantAssignments) {
        const employee = employeesById.get(assignment.employeeId)
        if (!employee) continue
        const participants = participantsByParticipation.get(assignment.participationId) ?? []
        participants.push(employee)
        participantsByParticipation.set(assignment.participationId, participants)
    }
    for (const school of filteredSchools) {
        relationsBySchool[school.id] = { contacts: [], employees: [], participations: [] }
    }
    for (const contact of contacts) {
        if (contact.schoolId !== null) {
            const { schoolId, ...details } = contact
            relationsBySchool[schoolId].contacts.push(details)
        }
    }
    for (const assignment of assignments) {
        const employee = employeesById.get(assignment.employeeId)
        if (employee) relationsBySchool[assignment.schoolId].employees.push(employee)
    }
    for (const { schoolId, ...participation } of participations) {
        relationsBySchool[schoolId].participations.push({
            ...participation,
            employees: participantsByParticipation.get(participation.id) ?? [],
        })
    }

    return (
        <SchoolTable
            data={filteredSchools}
            participationAsOf={participationAsOf}
            branches={branches}
            programs={programs}
            availableContacts={availableContacts}
            availableEmployees={employees}
            relationsBySchool={relationsBySchool}
        />
    )
}
