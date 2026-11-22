'use client'
import { createColumnHelper } from "@tanstack/react-table"
import { type DataTableFeatures } from "../../ui/data-table-features"
import { PersonWithRole } from '@/app/types'
import { Trash } from 'lucide-react'                         
import { PageActionLink } from '@/components/records/page-action-link'           
import { camelCaseIt } from "@/lib/utils"

const columnHelper = createColumnHelper<DataTableFeatures, PersonWithRole>()

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("personRole", {
    header: "Role",
    cell: ({row}) => row.original.personRole ? camelCaseIt(row.original.personRole) : "Unknown Role" 
  }),
  columnHelper.accessor("email", {
    header: "Email",
  }),
  columnHelper.accessor("phone", {
    header: "Phone",
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <PageActionLink href={`/details/contacts/${row.original.id}`}>
          View details
        </PageActionLink>
        <PageActionLink
          href={`/details/contacts/${row.original.id}/delete`}
          destructive
        >
          <Trash />
        </PageActionLink>
      </div>
    ),
  }),
])