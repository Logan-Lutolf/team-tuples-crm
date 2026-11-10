'use client'
import { RecordLink } from '@/components/records/record-link'

import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { ActionsCell } from "./actions-cell"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { Badge } from "@/components/ui/badge"

type Roles = Scalars<Models.public_Employee>["roles"]

export type Employee = {
    id: number,
    name: string,
    email: string,
    phone?: string | null,
    roles: Roles
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
    columnHelper.accessor("roles", {
        header: "Roles",
        cell: ({ row }) => {
            return (
                <div className="flex flex-wrap justify-center gap-1">
                    {row.original.roles.map(role => <Badge key={role} variant="outline" className="max-w-full whitespace-normal break-words">{role.replaceAll('_', ' ')}</Badge>)}
                </div>
                
            )
        }
    }),
    columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            return <ActionsCell employee={row.original} />
        },
    }),
])
