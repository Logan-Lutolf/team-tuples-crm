'use server'

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
            return { error: 'This program has linked participations, sponsors, assignments, or contact history. Remove or reassign those links before deleting it.' }
        }
        return { error: 'Could not delete this program. Refresh and try again.' }
    }
    revalidatePath('/programs')
    revalidatePath('/schools')
    return { success: true as const }
}

export async function getProgramDetails(programId: number) {
    programId = id(programId)
    const [program, participations, assignments, sponsors, interactions] = await Promise.all([
        db.orm.public.Program.where({ id: programId }).first(),
        db.orm.public.Participation.where({ programId }).orderBy(p => p.startDate.desc()).all().toArray(),
        db.orm.public.EmployeeAssignment.where({ programId }).all().toArray(),
        db.orm.public.MunicipalityPrograms.where({ programId }).all().toArray(),
        db.orm.public.Interaction.where({ programId }).orderBy(i => i.contactedAt.desc()).all().toArray(),
    ])
    if (!program) throw new Error('Program not found.')
    const schoolIds = [...new Set(participations.map(p => p.schoolId).concat(interactions.flatMap(i => i.schoolId === null ? [] : [i.schoolId])))]
    const employeeIds = [...new Set(assignments.map(a => a.employeeId).concat(interactions.map(i => i.employeeId)))]
    const municipalityIds = sponsors.map(s => s.municipalityId)
    const contactIds = [...new Set(interactions.map(i => i.contactId))]
    const [schools, employees, municipalities, contacts] = await Promise.all([
        schoolIds.length ? db.orm.public.School.where(s => s.id.in(schoolIds)).select('id', 'name').all().toArray() : [],
        employeeIds.length ? db.orm.public.Employee.where(e => e.id.in(employeeIds)).select('id', 'name').all().toArray() : [],
        municipalityIds.length ? db.orm.public.Municipality.where(m => m.id.in(municipalityIds)).select('id', 'name', 'mayor').all().toArray() : [],
        contactIds.length ? db.orm.public.Contact.where(c => c.id.in(contactIds)).select('id', 'name').all().toArray() : [],
    ])
    return { program, participations, assignments, interactions, schools, employees, municipalities, contacts }
}
