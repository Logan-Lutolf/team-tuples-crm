import Link from 'next/link'
import type { ReactNode } from 'react'
import { buttonVariants } from '@/components/ui/button'

export function PageActionLink({ href, children, destructive = false, fullWidth = false }: { href: string; children: ReactNode; destructive?: boolean; fullWidth?: boolean }) {
    return <Link href={href} prefetch={false} className={buttonVariants({ variant: destructive ? 'destructive' : 'default', className: fullWidth ? 'w-full' : undefined })}>{children}</Link>
}
