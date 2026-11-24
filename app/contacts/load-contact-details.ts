// import { timeDetails } from '@/lib/detail-timing'
// import { db } from '@/prisma/db'

// export async function loadContactDetails(contactId: number, editing = false, deferHistory = false) {
//     const [contact, interactions, employmentHistory, participationLinks] = await timeDetails('contacts:query-group-1', () => Promise.all([
//         db.orm.public.Person.where({ id: contactId }).first(),
//         !editing && deferHistory ? [] : db.orm.public.Interaction.where({ id: contactId }).orderBy([i => i.contactedAt.desc(), i => i.id.desc()]).all().toArray(),
//         db.orm.public.PersonEmployment.where({ id: contactId }).orderBy([e => e.startDate.desc(), e => e.id.desc()]).all().toArray(),
//         db.orm.public.ParticipationContacts.where({ personId: contactId }).all().toArray(),
//     ]))
//     if (!contact) throw new Error('Contact not found.')
//     const participationIds = participationLinks.map(link => link.participationId)
//     const participationRows = editing ? await db.orm.public.Participation.orderBy([p => p.startDate.desc(), p => p.id.desc()]).all().toArray()
//         : participationIds.length ? await db.orm.public.Participation.where(p => p.id.in(participationIds)).orderBy([p => p.startDate.desc(), p => p.id.desc()]).all().toArray() : []
//     const employeeIds = [...new Set([...interactions.map(i => i.employeeId), ...(contact.lastContactedById ? [contact.lastContactedById] : [])])].filter((id): id is number => id !== null)
//     const programIds = [...new Set([...participationRows.map(p => p.programId), ...interactions.flatMap(i => i.programId ? [i.programId] : [])])].filter((id): id is number => id !== null)
//     const schoolIds = [...new Set([...participationRows.map(p => p.organizationId), ...employmentHistory.map(e => e.id), ...interactions.flatMap(i => i.organizationId ? [i.organizationId] : []), ...(contact.orgId ? [contact.orgId] : [])])].filter((id): id is number => id !== null)
//     const [branches, schools, employees, programs] = await timeDetails('contacts:query-group-2', () => Promise.all([
//         (editing ? db.orm.public.Branch : db.orm.public.Branch.where({ name: contact.branchName ?? -1 })).select('id', 'name').all().toArray(),
//         editing ? db.orm.public.Organization.select('id', 'name').all().toArray() : schoolIds.length ? db.orm.public.Organization.where(s => s.id.in(schoolIds)).select('id', 'name').all().toArray() : [],
//         editing ? db.orm.public.Person.include("employee").select('id', 'name', 'email').all().toArray() : employeeIds.length ? db.orm.public.Person.where(e => e.id.in(employeeIds)).select('id', 'name', 'email').all().toArray() : [],
//         editing ? db.orm.public.Program.select('id', 'name').all().toArray() : programIds.length ? db.orm.public.Program.where(p => p.id.in(programIds)).select('id', 'name').all().toArray() : [],
//     ]))
//     return { asOf: Date.now(), contact, interactions, employmentHistory,
//         participations: participationRows.filter(p => participationIds.includes(p.id)),
//         participationOptions: editing ? participationRows : [], branches, schools, employees, programs, modes: [...db.enums.public.CommunicationMode.values] }
// }
