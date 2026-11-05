import { db } from '@/prisma/db'

export async function loadContactDetails(contactId: number, editing = false) {
    const [contact, interactions, employmentHistory, participationLinks] = await Promise.all([
        db.orm.public.Contact.where({ id: contactId }).first(),
        db.orm.public.Interaction.where({ contactId }).orderBy([i => i.contactedAt.desc(), i => i.id.desc()]).all().toArray(),
        db.orm.public.ContactEmployment.where({ contactId }).orderBy([e => e.startDate.desc(), e => e.id.desc()]).all().toArray(),
        db.orm.public.ParticipationContacts.where({ contactId }).all().toArray(),
    ])
    if (!contact) throw new Error('Contact not found.')
    const participationIds = participationLinks.map(link => link.participationId)
    const participationRows = editing ? await db.orm.public.Participation.orderBy([p => p.startDate.desc(), p => p.id.desc()]).all().toArray()
        : participationIds.length ? await db.orm.public.Participation.where(p => p.id.in(participationIds)).orderBy([p => p.startDate.desc(), p => p.id.desc()]).all().toArray() : []
    const employeeIds = [...new Set([...interactions.map(i => i.employeeId), ...(contact.last_contacted_byId ? [contact.last_contacted_byId] : [])])].filter((id): id is number => id !== null)
    const programIds = [...new Set([...participationRows.map(p => p.programId), ...interactions.flatMap(i => i.programId ? [i.programId] : [])])].filter((id): id is number => id !== null)
    const schoolIds = [...new Set([...participationRows.map(p => p.schoolId), ...employmentHistory.map(e => e.schoolId), ...interactions.flatMap(i => i.schoolId ? [i.schoolId] : []), ...(contact.schoolId ? [contact.schoolId] : [])])].filter((id): id is number => id !== null)
    const [branches, schools, employees, programs] = await Promise.all([
        (editing ? db.orm.public.Branch : db.orm.public.Branch.where({ id: contact.branchId ?? -1 })).select('id', 'name').all().toArray(),
        editing ? db.orm.public.School.select('id', 'name').all().toArray() : schoolIds.length ? db.orm.public.School.where(s => s.id.in(schoolIds)).select('id', 'name').all().toArray() : [],
        editing ? db.orm.public.Employee.select('id', 'name', 'email').all().toArray() : employeeIds.length ? db.orm.public.Employee.where(e => e.id.in(employeeIds)).select('id', 'name', 'email').all().toArray() : [],
        editing ? db.orm.public.Program.select('id', 'name').all().toArray() : programIds.length ? db.orm.public.Program.where(p => p.id.in(programIds)).select('id', 'name').all().toArray() : [],
    ])
    return { asOf: Date.now(), contact, interactions, employmentHistory,
        participations: participationRows.filter(p => participationIds.includes(p.id)),
        participationOptions: editing ? participationRows : [], branches, schools, employees, programs, modes: [...db.enums.public.CommunicationMode.values] }
}
