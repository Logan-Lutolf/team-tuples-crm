'use client'
import { RecordLink } from '@/components/records/record-link'

import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { ActionsCell } from "./actions-cell"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { nameInitials } from "@/lib/utils"

type Roles = Scalars<Models.public_Employee>["roles"]

export type Employee = {
    id: number,
    name: string,
    email: string,
    phone?: string | null,
    roles: Roles
    pfpImgUrl?: string
}

const columnHelper = createColumnHelper<DataTableFeatures, Employee>()

export const columns = columnHelper.columns([
    columnHelper.display({
        id: "pfp",
        cell: ({ row }) => {
            return (
                <Avatar>
                    <AvatarImage src={row.original.pfpImgUrl} />
                    <AvatarFallback>{nameInitials(String(row.original.name))}</AvatarFallback>
                </Avatar>
            )
        },
    }),
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
                    {row.original.roles.map(role => <Badge key={role} variant="outline" className="h-auto min-h-5 max-w-full whitespace-normal break-words text-center">{role.replaceAll('_', ' ')}</Badge>)}
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
