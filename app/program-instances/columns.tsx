'use client'
import { RecordLink } from '@/components/records/record-link'

import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../components/ui/data-table-features"
import { Participation } from '../types'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

type Student = {
    name: string,
    dob: string,
    school: string
    consent: string
}

const columnHelper = createColumnHelper<DataTableFeatures, Participation>()
const columnHelperStudents = createColumnHelper<DataTableFeatures, Student>()

export const columns = columnHelper.columns([
    columnHelper.accessor("name", {
        header: "Name",
        cell: ({ row }) => <RecordLink type="participations" id={row.original.id}>{row.original.name}</RecordLink>,
    }),
    columnHelper.accessor("schoolId", {
        header: "School ID",
    }),
    columnHelper.accessor("startDate", {
        header: "Start Date",
    }),
    columnHelper.accessor("endDate", {
        header: "End Date",
    }),
    columnHelper.accessor("status", {
        header: "Status",
    }),
    
])


export const studentColumns = columnHelperStudents.columns([
    columnHelperStudents.accessor("name", {
        header: "Student Name"
    }),
    columnHelperStudents.accessor("school", {
        header: "School"
    }),
    columnHelperStudents.accessor("dob", {
        header: "Date of Birth"
    }),
    columnHelperStudents.accessor("consent", {
        header: "Consent Collected?",
    }),
    columnHelperStudents.display({
        id: "actions",
        header: "",
        cell: ({row}) => {}
    }),
    
])

export const getStudentCols = (onDelete: (id: string) => void) => columnHelperStudents.columns([
    columnHelperStudents.accessor("name", {
        header: "Student Name"
    }),
    columnHelperStudents.accessor("school", {
        header: "School"
    }),
    columnHelperStudents.accessor("dob", {
        header: "Date of Birth"
    }),
    columnHelperStudents.accessor("consent", {
        header: "Consent Collected?",
    }),
    columnHelperStudents.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
        <Button
            variant="ghost"
            size="icon"
            aria-label="Remove student"
            onClick={() => onDelete(row.original.name)}
        >
            <X className="h-4 w-4" color="var(--destructive)" />
        </Button>
    ),
  }),
])