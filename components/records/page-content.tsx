'use client'
import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export function PageContent({ open = true, backHref, children }: { open?: boolean; backHref: string; children: ReactNode }) {
    const router = useRouter()
    useEffect(() => { if (!open) router.replace(backHref) }, [open, backHref, router])
    return <article className="grid min-w-0 gap-6">{children}</article>
}
export function PageHeader({ children }: { children: ReactNode }) { return <header className="grid gap-2">{children}</header> }
export function PageTitle({ children }: { children: ReactNode }) { return <h1 className="text-2xl font-semibold">{children}</h1> }
export function PageDescription({ children }: { children: ReactNode }) { return <p className="text-muted-foreground">{children}</p> }
