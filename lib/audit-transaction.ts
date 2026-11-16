import 'server-only'
import { db } from '@/prisma/db'
import { currentEmployee } from '@/lib/current-employee'
import { branchEditScope, authorizeBranchEdit, type BranchEditRequest } from '@/lib/branch-edit-access'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function auditTransaction<T>(work: (tx: Transaction) => PromiseLike<T>, edit?: BranchEditRequest): Promise<T> {
    const actor = await currentEmployee()
    return db.transaction(async tx => {
        await authorizeBranchEdit(tx, await branchEditScope(actor, tx), edit)
        // Transaction-local settings cannot leak an editor identity to another pooled request.
        await tx.query(db.raw.sql`SELECT
            set_config('crm.actor_id', ${actor ? String(actor.id) : ''}, true) AS actor_id,
            set_config('crm.actor_name', ${actor?.name ?? 'Unknown (not signed in)'}, true) AS actor_name`
            .returnsRow({ actor_id: { codecId: 'pg/text@1' }, actor_name: { codecId: 'pg/text@1' } }).build())
        return work(tx)
    })
}
