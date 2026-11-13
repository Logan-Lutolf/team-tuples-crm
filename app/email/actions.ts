'use server'
import { revalidatePath } from 'next/cache'
import { db } from '@/prisma/db'
import { loadEmailContacts, requireEmailAccess } from '@/lib/email-contacts-server'
import { filterEmailContacts, validateContactFilters, type SavedSegment } from '@/lib/email-contacts'

export async function saveEmailSegment(name: string, rawFilters: unknown) {
    const employee = await requireEmailAccess()
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) throw new Error('Enter a segment name of up to 100 characters.')
    const filters = validateContactFilters(rawFilters)
    // Recalculate on the server; never trust a list of snapshot records from the browser.
    const contacts = filterEmailContacts(await loadEmailContacts(), filters)
    if (!contacts.length) throw new Error('There are no contacts to save.')
    if (contacts.length > 20000) throw new Error('Narrow the filters to at most 20,000 contacts before saving.')
    const segment = await db.orm.public.EmailSegment.create({ name: name.trim(), createdById: employee.id,
        filtersJson: JSON.stringify(filters), contactsJson: JSON.stringify(contacts), contactCount: contacts.length })
    revalidatePath('/email')
    return { id: segment.id, name: segment.name, contactCount: segment.contactCount, createdAt: segment.createdAt }
}

export async function getEmailSegment(id: number): Promise<SavedSegment> {
    const employee = await requireEmailAccess()
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid segment.')
    const segment = await db.orm.public.EmailSegment.where({ id, createdById: employee.id }).first()
    if (!segment) throw new Error('Segment not found.')
    return { id: segment.id, name: segment.name, contactCount: segment.contactCount, createdAt: segment.createdAt,
        contacts: JSON.parse(segment.contactsJson), filters: JSON.parse(segment.filtersJson) }
}

export async function deleteEmailSegment(id: number) {
    const employee = await requireEmailAccess()
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid segment.')
    const deleted = await db.orm.public.EmailSegment.where({ id, createdById: employee.id }).delete()
    if (!deleted) throw new Error('Segment not found.')
    revalidatePath('/email')
}
