import { db } from "@/prisma/db";
import type { ComponentProps } from "react"
import type { SchoolDetails } from "./school-details"

export async function loadSchoolDetails(schoolId: number): Promise<ComponentProps<typeof SchoolDetails>> {
    const participationAsOf = Date.now()
    const [filteredSchools, branches, programs, availableContacts, employeeRows, roles] = await Promise.all([
        db.orm.public.School.where({ id: schoolId }).all().toArray(),
        db.orm.public.Branch.select("id", "name").all().toArray(),
        db.orm.public.Program.select("id", "name").all().toArray(),
        db.orm.public.Contact.where({ schoolId: null }).select("id", "name").all().toArray(),
        db.orm.public.Employee.select("id", "name", "email", "phone", "region").all().toArray(),
        db.orm.public.EmployeeAssignment.select("employeeId", "role").all().toArray(),
    ])

    const rolesByEmployee = new Map<number, Set<string>>()
    for (const assignment of roles) {
        const values = rolesByEmployee.get(assignment.employeeId) ?? new Set<string>()
        values.add(assignment.role)
        rolesByEmployee.set(assignment.employeeId, values)
    }
    const employees = employeeRows.map(employee => ({ ...employee, role: [...(rolesByEmployee.get(employee.id) ?? [])].join(", ") }))
    const schoolIds = filteredSchools.map((school) => school.id)
    const [contacts, assignments, participations, interactions] = schoolIds.length ? await Promise.all([
        db.orm.public.Contact.where((contact) => contact.schoolId.in(schoolIds))
            .select("id", "name", "schoolId", "email", "phone", "contactRole").all().toArray(),
        db.orm.public.LegacySchoolEmployees.where((assignment) => assignment.schoolId.in(schoolIds))
            .select("schoolId", "employeeId").all().toArray(),
        db.orm.public.Participation.where((participation) => participation.schoolId.in(schoolIds))
            .select("id", "name", "schoolId", "programId", "startDate", "endDate", "status").all().toArray(),
        db.orm.public.Interaction.where(interaction => interaction.schoolId.in(schoolIds)).orderBy(i => i.contactedAt.desc()).all().toArray(),
    ]) : [[], [], [], []]

    const participationIds = participations.map((participation) => participation.id)
    const participantAssignments = participationIds.length
        ? await db.orm.public.ParticipationEmployees
            .where((assignment) => assignment.participationId.in(participationIds))
            .select("participationId", "employeeId").all().toArray()
        : []

    const relationsBySchool: Record<number, Pick<ComponentProps<typeof SchoolDetails>, "contacts" | "employees" | "participations" | "interactions">> = {}
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
        relationsBySchool[school.id] = { contacts: [], employees: [], participations: [], interactions: [] }
    }
    for (const interaction of interactions) {
        if (interaction.schoolId !== null) relationsBySchool[interaction.schoolId].interactions.push(interaction)
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

    const school = filteredSchools[0]
    if (!school) throw new Error("School not found.")
    return { ...school, participationAsOf, branches, programs, availableContacts,
        availableEmployees: employees, ...relationsBySchool[school.id] }
}
