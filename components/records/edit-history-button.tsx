'use client'
import { createContext, useContext, type ReactNode } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { HistoryType } from '@/lib/edit-history-policy'

const HistoryAccess = createContext(false)

export function EditHistoryAccess({ allowed, children }: { allowed: boolean; children: ReactNode }) {
    return <HistoryAccess.Provider value={allowed}>{children}</HistoryAccess.Provider>
}

export function EditHistoryButton({ type, id }: { type: HistoryType; id: number }) {
    const allowed = useContext(HistoryAccess)
    if (!allowed) return null
    return <Button variant="outline" render={<Link href={`/details/${type}/${id}/edit-history`} />}>View edit history</Button>
}
