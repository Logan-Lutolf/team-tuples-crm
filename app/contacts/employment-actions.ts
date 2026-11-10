'use server'
import { db } from '@/prisma/db'
import { revalidatePath } from 'next/cache'
import { employmentData, employmentId, EmploymentValidationError } from '../../lib/contact-employment'

async function mutate(form: FormData, mode: 'create' | 'edit' | 'delete') {
    try {
        const contactId = employmentId(form.get('contact-id'))
        const recordId = mode === 'create' ? null : employmentId(form.get('employment-id'))
        if (mode === 'delete' && form.get('confirmation') !== 'delete') return { error: 'Type delete to confirm.' }
        const data = mode === 'delete' ? null : employmentData(form, mode === 'edit')
        await db.transaction(async tx => {
            if (!await tx.orm.public.Contact.where({ id: contactId }).first()) throw new EmploymentValidationError('This contact no longer exists.')
            if (recordId !== null && !await tx.orm.public.ContactEmployment.where({ id: recordId, contactId }).first()) throw new EmploymentValidationError('This employment record no longer exists for this contact.')
            if (data && data.schoolId !== null && !await tx.orm.public.School.where({ id: data.schoolId }).first()) throw new EmploymentValidationError('The selected school no longer exists.')
            if (mode === 'delete') await tx.orm.public.ContactEmployment.where({ id: recordId!, contactId }).delete()
            else if (mode === 'edit' && data) await tx.orm.public.ContactEmployment.where({ id: recordId!, contactId }).update(data)
            else if (data) await tx.orm.public.ContactEmployment.create({ contactId, ...data })
        })
    } catch (error) {
        return { error: error instanceof EmploymentValidationError ? error.message : 'Could not save employment history. Check the database migration and try again.' }
    }
    revalidatePath('/contacts')
    revalidatePath('/schools')
    return { success: true as const }
}
export async function addContactEmployment(form: FormData) { return mutate(form, 'create') }
export async function editContactEmployment(form: FormData) { return mutate(form, 'edit') }
export async function deleteContactEmployment(form: FormData) { return mutate(form, 'delete') }
