'use client'

import { RecordLink } from '@/components/records/record-link'
import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { OrganizationPerson } from '@/app/types'




const columnHelper = createColumnHelper<DataTableFeatures, OrganizationPerson>()

export const columns = columnHelper.columns([
    columnHelper.accessor("person.name", {
        header: "Name",
        cell: ({ row }) => <RecordLink type="participations" id={row.original.person.id}>{row.original.person.name}</RecordLink>,
    }),
    columnHelper.accessor("person.email", {
        header: "Program Type",
    }),
    columnHelper.accessor("person.phone", {
        header: "Phone #",
    }),
    columnHelper.accessor("roles.type", {
        header: "Role",
    }),
    
    // columnHelper.display({
    //     id: "actions",
    //     header: "Actions",
    //     cell: ({ row }) => {
    //         return <ActionsCell employee={row.original} />
    //     },
    // }),
])
