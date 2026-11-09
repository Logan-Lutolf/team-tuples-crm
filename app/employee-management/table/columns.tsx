'use client'

import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { ActionsCell } from "./actions-cell"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { nameInitials } from "@/lib/utils"

type Roles = Scalars<Models.public_Employee>["roles"]

export type Employee = {
    id: number,
    name: string,
    email: string,
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
    }),
    columnHelper.accessor("email", {
        header: "Email",
    }),
    columnHelper.accessor("roles", {
        header: "Roles",
        cell: ({ row }) => {
            return ( // Fix width to avoid overflow??
                <div className="w-full overflow-x-auto">
                    <ScrollArea aria-orientation="horizontal">
                        {row.original.roles.map((r) => {
                            return <Badge key={r} variant="outline" className="mr-1">{r}</Badge>
                        })}
                    </ScrollArea>
                </div>
                
            )
        }
    }),
    columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
            return <ActionsCell employee={row.original} />
        },
    }),
])
