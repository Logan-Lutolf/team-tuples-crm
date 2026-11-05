import Link from 'next/link'
import type { ReactNode } from 'react'
import { recordHref, type RecordType } from '@/lib/record-links'

export function RecordLink({ type, id, children }: { type: RecordType; id: number | null | undefined; children: ReactNode }) {
    if (id == null) return <>{children}</>
    return <Link href={recordHref(type, id)} prefetch={false} className="rounded-sm underline decoration-current/30 underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-ring">{children}</Link>
}
