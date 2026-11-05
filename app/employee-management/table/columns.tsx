'use client'
import { RecordLink } from '@/components/records/record-link'

import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { ActionsCell } from "./actions-cell"

export type Employee = {
    id: number,
    name: string,
    email: string,
    role: string,
    phone: string | null,
    globalRoles: string[],
}

const columnHelper = createColumnHelper<DataTableFeatures, Employee>()

export const columns = columnHelper.columns([
    columnHelper.accessor("name", {
        header: "Name",
        cell: ({ row }) => <RecordLink type="employees" id={row.original.id}>{row.original.name}</RecordLink>,
    }),
    columnHelper.accessor("email", {
        header: "Email",
    }),
    columnHelper.accessor("role", {
        header: "Role",
    }),
    columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
            return <ActionsCell employee={row.original} />
        },
    }),
])
