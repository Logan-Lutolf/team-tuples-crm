'use client'

import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { Skeleton } from "@/components/ui/skeleton"

export type Employee = {
    id: number,
    name: string,
    email: string,
    role: "ADMIN" | "WORKSHOPS_COORDINATOR" | "SCHOOL_NETWORK_COORDINATOR" | "STORIES_OF_OUR_NEIGHBORS_COORDINATOR" | "VETERANS_DAY_COORDINATOR" | "NEWSLETTER_COORDINATOR",
}

const columnHelper = createColumnHelper<DataTableFeatures, Employee>()

export const columns = columnHelper.columns([
    columnHelper.display({
        header: "Name",
        id: "actions",
        cell: ({ row }) => {
            return <Skeleton className="h-full w-full" />
        },
    }),
    columnHelper.display({
        header: "Email",
        id: "actions",
        cell: ({ row }) => {
            return <Skeleton className="h-full w-full" />
        },
    }),
    columnHelper.display({
        header: "Role",
        id: "role",
        cell: ({ row }) => {
            return <Skeleton className="h-full w-full" />
        },
    }),
    columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
            return <Skeleton className="h-full w-full" />
        },
    }),
])
