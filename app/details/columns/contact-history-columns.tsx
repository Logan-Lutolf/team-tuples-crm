'use client'
import { RecordLink } from '@/components/records/record-link'
import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { Interaction, Participation } from '@/app/types'
import { camelCaseIt, dateParsing, programParsing } from '@/lib/utils'


type InteractionRow = Interaction & { employeeName: string; programName: string }

const columnHelper = createColumnHelper<DataTableFeatures, InteractionRow>()

export const columns = columnHelper.columns([
    columnHelper.accessor("contactedAt", {
        header: "Date",
        cell: ({row}) => dateParsing(row.original.contactedAt)
    }),
    columnHelper.accessor("employeeName", {
        header: "Employee",
        cell: ({ row }) => <RecordLink type="employees" id={row.original.employeeId}>{row.original.employeeName}</RecordLink>,
    }),
    columnHelper.accessor("mode", {
        header: "Mode of Communication",
        cell: ({row}) => camelCaseIt(row.original.mode)
    }),
    columnHelper.accessor("programName", {
        header: "Program",
    }),
])
