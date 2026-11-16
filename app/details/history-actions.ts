'use server'
import { db } from '@/prisma/db'
import { timeDetails } from '@/lib/detail-timing'

export async function getRecordHistory(type: 'schools' | 'contacts' | 'programs', id: number) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid record ID.')
    if (!['schools', 'contacts', 'programs'].includes(type)) throw new Error('Invalid history type.')
    return timeDetails(`${type}:history`, async () => {
        const records = await db.orm.public.Interaction.where(
            type === 'schools' ? { organizationId: id } : type === 'contacts' ? { personId: id } : { programId: id },
        ).orderBy([i => i.contactedAt.desc(), i => i.id.desc()]).all().toArray()
        const ids = (field: 'personId' | 'personId' | 'orgId' | 'programId') => [...new Set(records.flatMap(r => r[field] === null ? [] : [r[field]]))]
        const employeeIds = ids('personId'), contactIds = ids('personId'), schoolIds = ids('orgId'), programIds = ids('programId')
        const [employees, contacts, schools, programs] = await Promise.all([
            employeeIds.length ? db.orm.public.Person.where(e => e.id.in(employeeIds)).select('id', 'name').all().toArray() : [],
            contactIds.length ? db.orm.public.Person.where(c => c.id.in(contactIds)).select('id', 'name').all().toArray() : [],
            schoolIds.length ? db.orm.public.Organization.where(s => s.id.in(schoolIds)).select('id', 'name').all().toArray() : [],
            programIds.length ? db.orm.public.Program.where(p => p.id.in(programIds)).select('id', 'name').all().toArray() : [],
        ])
        return { records, employees, contacts, schools, programs }
    })
}
