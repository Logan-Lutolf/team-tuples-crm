'use server'
import { db } from '@/prisma/db'
import { revalidatePath } from 'next/cache'
import { employmentId } from '../../lib/contact-employment'

export async function changeContactParticipation(form: FormData) {
    try {
        const contactId = employmentId(form.get('contact-id'))
        const participationId = employmentId(form.get('participation-id'))
        const operation = form.get('operation')
        if (operation !== 'add' && operation !== 'remove' && operation !== 'change') return { error: 'Choose a valid operation.' }
        await db.transaction(async tx => {
            // Serialize duplicate adds/changes for the same contact.
            if (!await tx.orm.public.Contact.where({ id: contactId }).forUpdate().first()) throw new Error('Contact missing')
            if (operation === 'remove') {
                await tx.orm.public.ParticipationContacts.where({ contactId, participationId }).delete()
                return
            }
            if (!await tx.orm.public.Participation.where({ id: participationId }).first()) throw new Error('Participation missing')
            if (operation === 'change') {
                const previousId = employmentId(form.get('previous-participation-id'))
                if (!await tx.orm.public.ParticipationContacts.where({ contactId, participationId: previousId }).first()) throw new Error('Link missing')
                if (previousId !== participationId) await tx.orm.public.ParticipationContacts.where({ contactId, participationId: previousId }).delete()
            }
            if (!await tx.orm.public.ParticipationContacts.where({ contactId, participationId }).first()) await tx.orm.public.ParticipationContacts.create({ contactId, participationId })
        })
    } catch { return { error: 'Could not update this contact’s participation. Refresh and check that the records still exist.' } }
    for (const path of ['/contacts', '/schools', '/programs']) revalidatePath(path)
    return { success: true as const }
}
