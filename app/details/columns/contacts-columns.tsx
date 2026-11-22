'use client'

import { RecordLink } from '@/components/records/record-link'
import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { OrganizationPerson, PersonWithStudent } from '@/app/types'
import { camelCaseIt, dateParsing } from '@/lib/utils'




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
    columnHelper.accessor("roles", {
        header: "Role",
        cell: ({row}) => camelCaseIt(row.original.roles ?? "")
    }),
    // columnHelper.display({
    //     id: "actions",
    //     header: "Actions",
    //     cell: ({ row }) => {
    //         return <ActionsCell employee={row.original} />
    //     },
    // }),
])


const studentColumnHelper = createColumnHelper<DataTableFeatures, PersonWithStudent>()

export const studentColumns = studentColumnHelper.columns([
    studentColumnHelper.accessor("name", {
        header: "Student Name",
        cell: ({ row }) => <RecordLink type="contacts" id={row.original.id}>{row.original.name}</RecordLink>
    }),
    studentColumnHelper.accessor("dob", {
        header: "Date of Birth",
        cell: ({ row }) => {dateParsing(row.original.dob) ?? row.original.dob}
    }),
    studentColumnHelper.accessor("email", {
        header: "Email"
    }),
    studentColumnHelper.accessor("phone", {
        header: "Phone"
    }),
    studentColumnHelper.accessor("student.guardianEmail", {
        header: "Guardian Email"
    }),
    studentColumnHelper.accessor("student.guardianPhone", {
        header: "Guardian Phone"
    }),
])