"use client"

import { ColumnVisibilityState, useTable, type ColumnDef, type RowData } from "@tanstack/react-table"

import {
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { features, type DataTableFeatures } from "./data-table-features"
import { Button } from "./button"
import { DashboardTable } from "@/components/records/dashboard-table"
import React from "react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "./dropdown-menu"
import { ChevronDown } from "lucide-react"

interface DataTableProps<TData extends RowData> {
    columns: ColumnDef<DataTableFeatures, TData>[]
    data: TData[]
    paginationEnabled?: boolean
    visibleRows?: number
}

const ROW_HEIGHT_REM = 2.75  
const HEADER_HEIGHT_REM = 2.5 

export function DataTable<TData extends RowData>({
    columns,
    data,
    paginationEnabled = true,
    visibleRows
}: DataTableProps<TData>) {
    const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({})
    
    const table = useTable({
        features,
        data,
        columns,
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            columnVisibility
        }
    })



    return (
        <>
        <div
            className={visibleRows ? "overflow-y-auto" : undefined}
            style={visibleRows ? {
                maxHeight: `${visibleRows * ROW_HEIGHT_REM + HEADER_HEIGHT_REM}rem`,
            } : undefined}
        >
            <div className="flex items-center py-4">
            <p></p>
            <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" className="ml-auto" />}>
                Columns <ChevronDown/>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {table
                .getAllColumns()
                .filter(
                    (column) => column.getCanHide()
                )
                .map((column) => {
                    return (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                        }
                    >
                        {column.id}
                    </DropdownMenuCheckboxItem>
                    )
                })}
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <DashboardTable className="table-fixed">
            <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                    return (
                    <TableHead key={header.id} style={{width: header.getSize()}}>
                        {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                        )}
                    </TableHead>
                    )
                })}
                </TableRow>
            ))}
            </TableHeader>
            <TableBody>
            {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                >
                    {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{width: cell.column.getSize()}}>
                        <table.FlexRender cell={cell} />
                    </TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </DashboardTable>
        
        {paginationEnabled && <div className="flex items-center justify-end space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
            >
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
            >
                Next
            </Button>
        </div>}
            </div>
        </>
    )
}