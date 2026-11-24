'use client'
import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../ui/data-table-features"
import { Branch } from '@/app/types'
import { Trash } from 'lucide-react'                         
import { PageActionLink } from '@/components/records/page-action-link'           
import { camelCaseIt } from "@/lib/utils"

const columnHelper = createColumnHelper<DataTableFeatures, Branch>()

export const columns = columnHelper.columns([
    columnHelper.accessor("name", {
        header: "Name",
        cell: ({row}) => camelCaseIt(row.original.name)
    }),
    columnHelper.accessor("institute", {
        header: "Institute",
        cell: ({row}) => row.original.institute ? camelCaseIt(row.original.institute) : "Unknown Institute" 
    }),
    columnHelper.accessor("region", {
        header: "Region",
        cell: ({row}) => camelCaseIt(row.original.region)
    }),
    columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
            <div className="flex flex-wrap items-center justify-center gap-2">
                <PageActionLink href={`/details/branches/${row.original.id}`}>
                    View details
                </PageActionLink>
                <PageActionLink
                    href={`/details/branches/${row.original.id}/delete`}
                    destructive
                >
                    <Trash />
                </PageActionLink>
            </div>
        ),
    }),
])