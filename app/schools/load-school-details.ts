import { db } from '@/prisma/db'
import type { ComponentProps } from 'react'
import type { SchoolDetails } from './school-details'

type Details = ComponentProps<typeof SchoolDetails>

export async function loadSchoolDetails(schoolId: number, editing = false): Promise<Details> {
    const [school, contacts, participations, interactions] = await Promise.all([
        db.orm.public.School.where({ id: schoolId }).first(),
        db.orm.public.Contact.where({ schoolId }).select('id', 'name', 'email', 'phone', 'contactRole').all().toArray(),
        db.orm.public.Participation.where({ schoolId }).all().toArray(),
        db.orm.public.Interaction.where({ schoolId }).orderBy(i => i.contactedAt.desc()).all().toArray(),
    ])
    if (!school) throw new Error('School not found.')
    const participationIds = participations.map(p => p.id)
    const programIds = [...new Set([...participations.map(p => p.programId), ...interactions.flatMap(i => i.programId === null ? [] : [i.programId])])]
    const [participantLinks, branches, programs, availableContacts] = await Promise.all([
        participationIds.length ? db.orm.public.ParticipationEmployees.where(a => a.participationId.in(participationIds)).select('participationId', 'employeeId').all().toArray() : [],
        (editing ? db.orm.public.Branch : db.orm.public.Branch.where({ id: school.branchId })).select('id', 'name').all().toArray(),
        editing ? db.orm.public.Program.select('id', 'name').all().toArray() : programIds.length ? db.orm.public.Program.where(p => p.id.in(programIds)).select('id', 'name').all().toArray() : [],
        editing ? db.orm.public.Contact.where({ schoolId: null }).select('id', 'name').all().toArray() : [],
    ])
    const employeeIds = [...new Set([...participantLinks.map(a => a.employeeId), ...interactions.map(i => i.employeeId)])]
    const [employeeRows, roles] = await Promise.all([
        editing ? db.orm.public.Employee.select('id', 'name', 'email', 'phone', 'region').all().toArray() : employeeIds.length ? db.orm.public.Employee.where(e => e.id.in(employeeIds)).select('id', 'name', 'email', 'phone', 'region').all().toArray() : [],
        editing ? db.orm.public.EmployeeAssignment.select('employeeId', 'role').all().toArray() : [],
    ])
    const rolesByEmployee = new Map<number, Set<string>>()
    for (const assignment of roles) {
        const values = rolesByEmployee.get(assignment.employeeId) ?? new Set<string>()
        values.add(assignment.role)
        rolesByEmployee.set(assignment.employeeId, values)
    }
    const employees = employeeRows.map(e => ({ ...e, role: [...(rolesByEmployee.get(e.id) ?? [])].join(', ') }))
    const employeesById = new Map(employees.map(e => [e.id, e]))
    const participantsById = new Map<number, typeof employees>()
    for (const link of participantLinks) {
        const employee = employeesById.get(link.employeeId)
        if (!employee) continue
        const records = participantsById.get(link.participationId) ?? []
        records.push(employee)
        participantsById.set(link.participationId, records)
    }
    return { ...school, participationAsOf: Date.now(), branches, programs, availableContacts,
        availableEmployees: employees, contacts, employees: [], interactions,
        participations: participations.map(p => ({ ...p, employees: participantsById.get(p.id) ?? [] })) }
}
