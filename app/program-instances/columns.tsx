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
    school?: string,
    email?: string,
    phone?: string,
    guardianEmail: string,
    guardianPhone?: string
}

const columnHelper = createColumnHelper<DataTableFeatures, Participation>()
const columnHelperStudents = createColumnHelper<DataTableFeatures, Student>()

export const columns = columnHelper.columns([
    columnHelper.accessor("name", {
        header: "Name",
        cell: ({ row }) => <RecordLink type="participations" id={row.original.id}>{row.original.name}</RecordLink>,
    }),
    columnHelper.accessor("organizationId", {
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
    columnHelperStudents.accessor("dob", {
        header: "Date of Birth", 
    }),
    columnHelperStudents.accessor("school", {
        header: "School"
    }),
    // columnHelperStudents.display({
    //     id: "actions",
    //     header: "",
    //     cell: ({ row }) => (
    //     <Button
    //         variant="ghost"
    //         size="icon"
    //         aria-label="Remove student"
    //         onClick={() => onDelete(row.original.name)}
    //     >
    //         <X className="h-4 w-4" color="var(--destructive)" />
    //     </Button>
    // ),
    // }),
    
])

export const getStudentCols = (onDelete: (index: number) => void) => columnHelperStudents.columns([
    columnHelperStudents.accessor("name", {
        header: "Student Name",
        size: 50
    }),
    columnHelperStudents.accessor("school", {
        header: "School",
        size: 50
    }),
    columnHelperStudents.accessor("dob", {
        header: "Date of Birth",
        size: 20
    }),
    columnHelperStudents.display({
    id: "actions",
    size: 10,
    header: "",
    cell: ({ row }) => (
        <Button
            variant="ghost"
            size="icon"
            aria-label="Remove student"
            onClick={() => onDelete(row.index)}
        >
            <X className="h-4 w-4" color="var(--destructive)" />
        </Button>
    ),
    }),
])