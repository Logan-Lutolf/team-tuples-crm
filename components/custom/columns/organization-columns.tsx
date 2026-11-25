'use client'
import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../ui/data-table-features"
import { Organization, PersonWithRole } from '@/app/types'
import { Trash } from 'lucide-react'                         
import { PageActionLink } from '@/components/records/page-action-link'           
import { camelCaseIt } from "@/lib/utils"

const columnHelper = createColumnHelper<DataTableFeatures, Organization>()

export const columns = columnHelper.columns([
    columnHelper.accessor("name", {
        header: "Name",
        cell: ({row}) => {return camelCaseIt(row.original.name ?? "Unknown Name")}
    }),
    columnHelper.accessor("email", {
        header: "Email",
    }),
    columnHelper.accessor("phone", {
        header: "Phone",
    }),
    columnHelper.accessor("region", {
        header: "Region",
        cell: ({row}) => {return camelCaseIt(row.original.region ?? "Unknown Region")}
    }),
    columnHelper.accessor("branchName", {
        header: "Branch Assigned",
        cell: ({row}) => {return camelCaseIt(row.original.branchName ?? "No Branch Assigned")}
    }),
    columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
        <div className="flex flex-wrap items-center justify-center gap-2">
            <PageActionLink href={`/details/contacts/${row.original.id}`}>
            View details
            </PageActionLink>
            <PageActionLink
            href={`/details/contacts/${row.original.id}/delete`}
            destructive
            >
            <Trash />
            </PageActionLink>
        </div>
        ),
    }),
])