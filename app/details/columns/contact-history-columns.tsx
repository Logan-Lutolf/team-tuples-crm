'use client'
import { RecordLink } from '@/components/records/record-link'
import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { Interaction, Participation } from '@/app/types'
import { camelCaseIt, dateParsing, programParsing } from '@/lib/utils'


// contact-history-columns.tsx
export type EmployeeInteractionRow = Interaction & { personName: string; programName: string }
export type ContactInteractionRow = Interaction & { employeeName: string; programName: string }

const columnHelper = createColumnHelper<DataTableFeatures, EmployeeInteractionRow>()
const contactColumnHelper = createColumnHelper<DataTableFeatures, ContactInteractionRow>()

// type InteractionRowEmp = Interaction & { personName: string; programName: string }
// type InteractionRow = Interaction & { employeeName: string; programName: string }


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


export const contactColumns = contactColumnHelper.columns([
    contactColumnHelper.accessor("contactedAt", {
        header: "Date",
        cell: ({row}) => dateParsing(row.original.contactedAt)
    }),
    contactColumnHelper.accessor("employeeName", {
        header: "Contact",
        cell: ({ row }) => <RecordLink type="employees" id={row.original.employeeId}>{row.original.employeeName}</RecordLink>,
    }),
    contactColumnHelper.accessor("mode", {
        header: "Mode of Communication",
        cell: ({row}) => camelCaseIt(row.original.mode)
    }),
    contactColumnHelper.accessor("programName", {
        header: "Program",
    }),
])
