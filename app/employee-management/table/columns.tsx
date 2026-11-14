'use client'
import { RecordLink } from '@/components/records/record-link'

import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { ActionsCell } from "./actions-cell"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { nameInitials } from "@/lib/utils"
import { EmployeePerson } from '@/app/types'




const columnHelper = createColumnHelper<DataTableFeatures, EmployeePerson>()

export const columns = columnHelper.columns([
    columnHelper.display({
        id: "pfp",
        cell: ({ row }) => {
            return (
                <Avatar>
                    <AvatarImage src={row.original.employee.pfpImgUrl} />
                    <AvatarFallback>{nameInitials(String(row.original.person.name))}</AvatarFallback>
                </Avatar>
            )
        },
    }),
    columnHelper.accessor("person.name", {
        header: "Name",
        cell: ({ row }) => <RecordLink type="employees" id={row.original.person.id}>{row.original.person.name}</RecordLink>,
    }),
    columnHelper.accessor("person.email", {
        header: "Email",
    }),
    columnHelper.accessor("employee.role", {
        header: "Roles",
        cell: ({ row }) => {
            return (
                <div className="flex flex-wrap justify-center gap-1">
                    {row.original.employee.role.map(role => <Badge key={role} variant="outline" className="max-w-full whitespace-normal break-words">{role.replaceAll('_', ' ')}</Badge>)}
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
