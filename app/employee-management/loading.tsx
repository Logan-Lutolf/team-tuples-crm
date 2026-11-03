import { columns } from "./table/columns"
import { LoadingDataTable } from "@/components/custom/loading/loading-data-table"

export default function SkeletonTable() {
    return (
        <LoadingDataTable columns={columns} data={[]} />
    )
}
