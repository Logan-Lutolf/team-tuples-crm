'use client'
import { RecordLink } from '@/components/records/record-link'

import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { nameInitials } from "@/lib/utils"
import { EmployeePerson, PersonWithEmployee } from '@/app/types'
import { PageActionLink } from '@/components/records/page-action-link'
import { Trash } from 'lucide-react'
import { getUserRole } from '@/lib/auth'


const columnHelper = createColumnHelper<DataTableFeatures, PersonWithEmployee>()

export const columns = columnHelper.columns([
    columnHelper.display({
        id: "pfp",
        cell: ({ row }) => {
            return (
                <Avatar>
                    <AvatarImage src={row.original.employee.pfpImgUrl} />
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
    cell: ({ row }) => (
        <div className="flex flex-wrap items-center justify-center gap-2">
            <PageActionLink href={`/details/employees/${row.original.id}`}>
                View details
            </PageActionLink>
            <PageActionLink
                href={`/details/employees/${row.original.id}/delete`}
                destructive
            >
            <Trash />
            </PageActionLink>
        </div>
        ),
    }),
])
