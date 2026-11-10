'use server'
import { timeDetails } from '@/lib/detail-timing'

import { revalidatePath } from 'next/cache'
import { db } from '@/prisma/db'

function id(value: FormDataEntryValue | number | null) {
    const result = Number(value)
    if (!Number.isSafeInteger(result) || result <= 0) throw new Error('Invalid program ID.')
    return result
}

export async function saveProgram(form: FormData) {
    const rawName = form.get('name')
    const rawDescription = form.get('description')
    if (typeof rawName !== 'string' || !rawName.trim()) return { error: 'Program name is required.' }
    if (rawDescription !== null && typeof rawDescription !== 'string') return { error: 'Enter a valid description.' }
    try {
        const data = { name: rawName.trim(), description: rawDescription?.trim() || null }
        if (form.has('id')) {
            const programId = id(form.get('id'))
            await db.transaction(async tx => {
                if (!await tx.orm.public.Program.where({ id: programId }).first()) throw new Error('Not found')
                await tx.orm.public.Program.where({ id: programId }).update(data)
            })
        } else await db.orm.public.Program.create(data)
    } catch { return { error: 'Could not save this program. Refresh and try again.' } }
    revalidatePath('/programs')
    revalidatePath('/schools')
    return { success: true as const }
}

export async function deleteProgram(form: FormData) {
    if (form.get('confirmation') !== 'delete') return { error: 'Type delete to confirm.' }
    try {
        await db.orm.public.Program.where({ id: id(form.get('id')) }).delete()
    } catch (error) {
        if (error && typeof error === 'object' && 'sqlState' in error && error.sqlState === '23503') {
            return { error: 'Could not clear a related link. Confirm the automatic-deletion migration has been applied and try again.' }
        }
        return { error: 'Could not delete this program. Refresh and try again.' }
    }
    revalidatePath('/programs')
    revalidatePath('/schools')
    return { success: true as const }
}

export async function getProgramDetails(programId: number, editing = false, deferHistory = false) {
    programId = id(programId)
    const [program, participations, assignments, sponsors, interactions] = await timeDetails('programs:query-group-1', () => Promise.all([
        db.orm.public.Program.where({ id: programId }).first(),
        db.orm.public.Participation.where({ programId }).orderBy(p => p.startDate.desc()).all().toArray(),
        db.orm.public.EmployeeAssignment.where({ programId }).all().toArray(),
        db.orm.public.MunicipalityPrograms.where({ programId }).all().toArray(),
        !editing && deferHistory ? [] : db.orm.public.Interaction.where({ programId }).orderBy(i => i.contactedAt.desc()).all().toArray(),
    ]))
    if (!program) throw new Error('Program not found.')
    const schoolIds = [...new Set(participations.map(p => p.schoolId).concat(interactions.flatMap(i => i.schoolId === null ? [] : [i.schoolId])))].filter((id): id is number => id !== null)
    const employeeIds = [...new Set([...assignments.map(a => a.employeeId), ...interactions.map(i => i.employeeId)])].filter((id): id is number => id !== null)
    const municipalityIds = sponsors.map(s => s.municipalityId)
    const contactIds = [...new Set(interactions.map(i => i.contactId))].filter((id): id is number => id !== null)
    const [schools, employees, municipalities, contacts] = await timeDetails('programs:query-group-2', () => Promise.all([
        editing ? db.orm.public.School.select('id', 'name').all().toArray() : schoolIds.length ? db.orm.public.School.where(s => s.id.in(schoolIds)).select('id', 'name').all().toArray() : [],
        editing ? db.orm.public.Employee.select('id', 'name', 'email', 'phone', 'region').all().toArray() : employeeIds.length ? db.orm.public.Employee.where(e => e.id.in(employeeIds)).select('id', 'name', 'email', 'phone', 'region').all().toArray() : [],
        editing ? db.orm.public.Municipality.select('id', 'name', 'mayor').all().toArray() : municipalityIds.length ? db.orm.public.Municipality.where(m => m.id.in(municipalityIds)).select('id', 'name', 'mayor').all().toArray() : [],
        editing ? db.orm.public.Contact.select('id', 'name').all().toArray() : contactIds.length ? db.orm.public.Contact.where(c => c.id.in(contactIds)).select('id', 'name').all().toArray() : [],
    ]))
    const [branches, participants] = await timeDetails('programs:query-group-3', () => Promise.all([
        editing ? db.orm.public.Branch.select('id', 'name').all().toArray() : [],
        editing && participations.length ? db.orm.public.ParticipationEmployees.where(a => a.participationId.in(participations.map(p => p.id))).all().toArray() : [],
    ]))
    return { asOf: Date.now(), program, participations, assignments, interactions, schools, employees, municipalities: municipalities.filter(m => municipalityIds.includes(m.id)), contacts,
        availableMunicipalities: editing ? municipalities.filter(m => !municipalityIds.includes(m.id)) : [], branches, participants,
        roles: [...db.enums.public.Role.values], regions: [...db.enums.public.Region.values], modes: [...db.enums.public.CommunicationMode.values] }
}

export async function changeProgramRelationship(form: FormData) {
    try {
        const programId = id(form.get('program-id'))
        const operation = form.get('operation')
        await db.transaction(async tx => {
            if (!await tx.orm.public.Program.where({ id: programId }).forUpdate().first()) throw new Error('Program missing')
            if (operation === 'add-sponsor' || operation === 'remove-sponsor') {
                const municipalityId = id(form.get('municipality-id'))
                if (operation === 'remove-sponsor') await tx.orm.public.MunicipalityPrograms.where({ programId, municipalityId }).delete()
                else if (!await tx.orm.public.MunicipalityPrograms.where({ programId, municipalityId }).first()) await tx.orm.public.MunicipalityPrograms.create({ programId, municipalityId })
            } else if (operation === 'remove-assignment') {
                await tx.orm.public.EmployeeAssignment.where({ id: id(form.get('assignment-id')), programId }).delete()
            } else if (operation === 'add-assignment' || operation === 'edit-assignment') {
                const employeeId = id(form.get('employee-id'))
                const role = db.enums.public.Role.values.find(r => r === form.get('role'))
                const regionValue = form.get('region')
                const region = regionValue ? db.enums.public.Region.values.find(r => r === regionValue) : null
                if (!role || (regionValue && !region)) throw new Error('Invalid scope')
                const branchId = form.get('branch-id') ? id(form.get('branch-id')) : null
                const data = { programId, employeeId, role, region: region ?? null, branchId }
                if (operation === 'add-assignment') {
                    if (!await tx.orm.public.EmployeeAssignment.where(data).first()) await tx.orm.public.EmployeeAssignment.create(data)
                } else {
                    const where = { id: id(form.get('assignment-id')), programId }
                    if (!await tx.orm.public.EmployeeAssignment.where(where).first()) throw new Error('Assignment missing')
                    await tx.orm.public.EmployeeAssignment.where(where).update(data)
                }
            } else throw new Error('Invalid operation')
        })
    } catch { return { error: 'Could not update this relationship. Check that all selected records still exist.' } }
    for (const path of ['/programs', '/schools', '/branches', '/municipalities', '/employee-management']) revalidatePath(path)
    return { success: true as const }
}
