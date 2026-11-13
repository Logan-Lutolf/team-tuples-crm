'use client'
import { createContext, useContext, type ReactNode } from 'react'
import { canEditBranchRecord, type BranchEditScope } from '@/lib/branch-edit-policy'

const Access = createContext<BranchEditScope>({ restricted: false, branchIds: [] })
export function BranchEditAccess({ scope, children }: { scope: BranchEditScope; children: ReactNode }) {
    return <Access.Provider value={scope}>{children}</Access.Provider>
}
export function useCanEditBranch(branchId: number | null) {
    return canEditBranchRecord(useContext(Access), branchId)
}
