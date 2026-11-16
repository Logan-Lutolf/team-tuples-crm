'use client'

import { RecordLink } from '@/components/records/record-link'
import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { EmployeeAssignment } from '@/app/types'


const columnHelper = createColumnHelper<DataTableFeatures, EmployeeAssignment>()

export const columns = columnHelper.columns([
    columnHelper.accessor("programId", {
        header: "Program Id",
        cell: ({ row }) => <RecordLink type="participations" id={row.original.id}>{row.original.id}</RecordLink>,
    }),
    columnHelper.accessor("region", {
        header: "Region",
    }),
])
