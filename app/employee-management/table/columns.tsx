'use client'

import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { ActionsCell } from "./actions-cell"

export type Employee = {
    id: number,
    name: string,
    email: string,
    role: "ADMIN" | "WORKSHOPS_COORDINATOR" | "SCHOOL_NETWORK_COORDINATOR" | "STORIES_OF_OUR_NEIGHBORS_COORDINATOR" | "VETERANS_DAY_COORDINATOR" | "NEWSLETTER_COORDINATOR",
}

const columnHelper = createColumnHelper<DataTableFeatures, Employee>()

export const columns = columnHelper.columns([
    columnHelper.accessor("name", {
        header: "Name",
    }),
    columnHelper.accessor("email", {
        header: "Email",
    }),
    columnHelper.accessor("role", {
        header: "Role",
    }),
    columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
            return <ActionsCell employee={row.original} />
        },
    }),
])
