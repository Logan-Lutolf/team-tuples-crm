import { db } from '@/prisma/db'

export async function loadContactDetails(contactId: number, editing = false) {
    const [contact, interactions] = await Promise.all([
        db.orm.public.Contact.where({ id: contactId }).first(),
        db.orm.public.Interaction.where({ contactId }).orderBy([i => i.contactedAt.desc(), i => i.id.desc()]).all().toArray(),
    ])
    if (!contact) throw new Error('Contact not found.')
    const employeeIds = [...new Set([...interactions.map(i => i.employeeId), ...(contact.last_contacted_byId ? [contact.last_contacted_byId] : [])])]
    const programIds = [...new Set(interactions.flatMap(i => i.programId ? [i.programId] : []))]
    const schoolIds = [...new Set([...interactions.flatMap(i => i.schoolId ? [i.schoolId] : []), ...(contact.schoolId ? [contact.schoolId] : [])])]
    const [branches, schools, employees, programs] = await Promise.all([
        (editing ? db.orm.public.Branch : db.orm.public.Branch.where({ id: contact.branchId })).select('id', 'name').all().toArray(),
        editing ? db.orm.public.School.select('id', 'name').all().toArray() : schoolIds.length ? db.orm.public.School.where(s => s.id.in(schoolIds)).select('id', 'name').all().toArray() : [],
        editing ? db.orm.public.Employee.select('id', 'name', 'email').all().toArray() : employeeIds.length ? db.orm.public.Employee.where(e => e.id.in(employeeIds)).select('id', 'name', 'email').all().toArray() : [],
        editing ? db.orm.public.Program.select('id', 'name').all().toArray() : programIds.length ? db.orm.public.Program.where(p => p.id.in(programIds)).select('id', 'name').all().toArray() : [],
    ])
    return { contact, interactions, branches, schools, employees, programs, modes: [...db.enums.public.CommunicationMode.values] }
}
