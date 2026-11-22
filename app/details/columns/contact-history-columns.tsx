'use client'
import { RecordLink } from '@/components/records/record-link'
import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { Interaction, Participation } from '@/app/types'
import { camelCaseIt, dateParsing, programParsing } from '@/lib/utils'


type InteractionRowEmp = Interaction & { personName: string; programName: string }

const columnHelper = createColumnHelper<DataTableFeatures, InteractionRowEmp>()

export const columns = columnHelper.columns([
    columnHelper.accessor("contactedAt", {
        header: "Date",
        cell: ({row}) => dateParsing(row.original.contactedAt)
    }),
    columnHelper.accessor("personName", {
        header: "Contact",
        cell: ({ row }) => <RecordLink type="contacts" id={row.original.employeeId}>{row.original.personName}</RecordLink>,
    }),
    columnHelper.accessor("mode", {
        header: "Mode of Communication",
        cell: ({row}) => camelCaseIt(row.original.mode)
    }),
    columnHelper.accessor("programName", {
        header: "Program",
    }),
])
