import type { ComponentProps } from 'react'
import { Table } from '@/components/ui/table'

/** Shared frame and column alignment for the six dashboard record lists. */
export function DashboardTable({ className = '', ...props }: ComponentProps<typeof Table>) {
    return <div className="min-w-0 overflow-hidden rounded-md border">
        <Table
            className={`min-w-[800px] table-fixed [&_th]:px-4 [&_th]:text-center [&_td]:px-4 [&_td]:py-3 [&_td]:text-center [&_td]:whitespace-normal [&_td]:break-words ${className}`}
            {...props}
        />
    </div>
}
