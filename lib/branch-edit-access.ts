import 'server-only'
import { db } from '@/prisma/db'
import { assertBranchEdit, type BranchEditScope } from './branch-edit-policy'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
type Actor = { id: number; roles: readonly string[] } | null
export type BranchEditRequest = { type: 'Contact' | 'School'; id: number; destinationBranchId?: number | null; schoolId?: number | null }

export async function branchEditScope(actor: Actor, client: Pick<typeof db, 'orm'> = db): Promise<BranchEditScope> {
    if (!actor) return { restricted: true, branchIds: [] }
    const eva = await client.orm.public.Employee.where({ email: 'eva.mikulaskova@postbellum.cz' }).select('id').first()
    if (!eva) return { restricted: false, branchIds: [] }
    const branches = await client.orm.public.Branch.where({ chiefId: eva.id, name: 'SIX' }).select('id').all().toArray()
    const assignments = await client.orm.public.EmployeeAssignment.where({ employeeId: actor.id }).select('branchId').all().toArray()
    const branchIds = branches.filter(b => actor.id === eva.id || assignments.some(a => a.branchId === b.id)).map(b => b.id)
    return { restricted: branchIds.length > 0, branchIds }
}

export async function authorizeBranchEdit(tx: Transaction, scope: BranchEditScope, request?: BranchEditRequest) {
    if (!scope.restricted) return
    if (!request) return assertBranchEdit(scope, [])
    const record = request.type === 'Contact'
        ? await tx.orm.public.Contact.where({ id: request.id }).select('branchId').forUpdate().first()
        : await tx.orm.public.School.where({ id: request.id }).select('branchId').forUpdate().first()
    if (!record) throw new Error('This record no longer exists.')
    const branches = [record.branchId]
    if (request.destinationBranchId !== undefined) branches.push(request.destinationBranchId)
    if (request.schoolId != null) {
        const school = await tx.orm.public.School.where({ id: request.schoolId }).select('branchId').forUpdate().first()
        branches.push(school?.branchId ?? null)
    }
    assertBranchEdit(scope, branches)
}
