



'use client'
import { RecordLink } from '@/components/records/record-link'
import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { Participation } from '@/app/types'
import { dateParsing, programParsing } from '@/lib/utils'




const columnHelper = createColumnHelper<DataTableFeatures, Participation>()

export const columns = columnHelper.columns([
    columnHelper.accessor("name", {
        header: "Name",
        cell: ({ row }) => <RecordLink type="participations" id={row.original.id}>{row.original.name}</RecordLink>,
    }),
    columnHelper.accessor("programType", {
        header: "Program Type",
        cell: ({row}) => programParsing(row.original.programType)
    }),
    columnHelper.accessor("startDate", {
        header: "Start Date",
        cell: ({row}) => dateParsing(row.original.startDate)
    }),
    columnHelper.accessor("endDate", {
        header: "End Date",
        cell: ({row}) => dateParsing(row.original.endDate ?? "")
    }),
    columnHelper.accessor("status", {
        header: "Status",
        cell: ({row}) => row.original.status.substring(0,1) + row.original.status.substring(1).toLowerCase()
    }),
    // columnHelper.display({
    //     id: "actions",
    //     header: "Actions",
    //     cell: ({ row }) => {
    //         return <ActionsCell employee={row.original} />
    //     },
    // }),
])
