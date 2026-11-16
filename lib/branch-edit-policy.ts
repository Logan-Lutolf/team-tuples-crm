export class BranchEditPermissionError extends Error {}

export type BranchEditScope = {
    branchIds: number[]
    restricted: boolean
}

export function canEditBranchRecord(scope: BranchEditScope, branchId: number | null) {
    return !scope.restricted || (branchId !== null && scope.branchIds.includes(branchId))
}

export function assertBranchEdit(scope: BranchEditScope, branchIds: (number | null)[]) {
    if (scope.restricted && (!branchIds.length || !branchIds.every(id => canEditBranchRecord(scope, id)))) {
        throw new BranchEditPermissionError('You can only edit contacts and schools in Eva’s branch.')
    }
}
