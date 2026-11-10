import { DashboardTable } from '@/components/records/dashboard-table'
import { PageActionLink } from '@/components/records/page-action-link'
import { RecordLink } from '@/components/records/record-link'
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import type { Models } from "@/prisma/contract";
import type { Scalars } from "@prisma/orm-postgres/components";


type School = Scalars<Models.public_School>
export function SchoolTable({ data }: { data: School[] }) {
    return(
        <DashboardTable>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone #</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {data.map((school: School) => (
                    <TableRow key={school.id}>
                        <TableCell><RecordLink type="schools" id={school.id}>{school.name}</RecordLink></TableCell>
                        <TableCell>{school.email}</TableCell>
                        <TableCell>{school.phone}</TableCell>
                        <TableCell>
                            {school.address.street}, {school.address.zipCode}
                        </TableCell>
                        <TableCell><div className="flex flex-wrap items-center justify-center gap-2">
                            <PageActionLink href={`/details/schools/${school.id}`}>View details</PageActionLink>
                            <PageActionLink href={`/details/schools/${school.id}/delete`} destructive>Delete</PageActionLink>

                        </div></TableCell>
                    </TableRow>
                ))}
                {!data.length && <TableRow><TableCell colSpan={5} className="h-24">No results.</TableCell></TableRow>}
            </TableBody>
        </DashboardTable>
    )
}
