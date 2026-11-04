import type { db } from '../prisma/db'
import type { Models } from '../prisma/contract'
import type { Scalars } from '@prisma/orm-postgres/components'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
type InteractionData = Pick<Scalars<Models.public_Interaction>, 'schoolId' | 'contactId' | 'employeeId' | 'programId' | 'contactedAt' | 'mode'>

// Call inside a transaction; locking the contact serializes summary updates.
export async function recordInteraction(tx: Transaction, data: InteractionData) {
    const contact = await tx.orm.public.Contact.where({ id: data.contactId, schoolId: data.schoolId }).forUpdate().first()
    if (!contact) throw new Error('Choose a contact assigned to this school.')
    await tx.orm.public.Interaction.create(data)
    const latest = await tx.orm.public.Interaction.where({ contactId: data.contactId })
        .orderBy([i => i.contactedAt.desc(), i => i.id.desc()]).first()
    if (latest) await tx.orm.public.Contact.where({ id: data.contactId }).update({
        last_contacted: latest.contactedAt, last_contacted_byId: latest.employeeId,
    })
}
