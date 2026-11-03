'use client'

import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../../components/ui/data-table-features"
import { MoreHorizontal, Pencil, Trash, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditEmployeeForm } from "../forms/edit-employee-form"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
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
