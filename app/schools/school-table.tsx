import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import type { Models } from "@/prisma/contract";
import { Button } from "@/components/ui/button"
import type { Scalars } from "@prisma/orm-postgres/components";
import { Trash, Ellipsis } from "lucide-react";
import { ActionDialog } from "@/components/custom/action-dialog";
import { DeleteSchoolForm } from "./delete-form";
import { SchoolDetailsDialog } from "./school-details-dialog";


type School = Scalars<Models.public_School>
export function SchoolTable({ data }: { data: School[] }) {
    return(
        <Table className="border border-black">
            <TableHeader className="rounded-4xl">
                <TableRow className="border border-black">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone #</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {data.map((school: School) => (
                    <TableRow key={school.id} className="border border-black">
                        <TableCell>{school.name}</TableCell>
                        <TableCell>{school.email}</TableCell>
                        <TableCell>{school.phone}</TableCell>
                        <TableCell>
                            {school.address.street}, {school.address.zipCode}
                        </TableCell>
                        <TableCell className="flex flex-row gap-2">
                            <SchoolDetailsDialog schoolId={school.id} schoolName={school.name} />
                            <ActionDialog
                                icon={<Trash />}
                                content={<DeleteSchoolForm schoolId={school.id} schoolName={school.name} />}
                                variant="destructive"
                            />
                            <Button size='sm' variant="ghost">
                                <Ellipsis/>
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
