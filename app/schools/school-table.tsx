import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import type { Models } from "@/prisma/contract";
import { Button } from "@/components/ui/button"
import type { Scalars } from "@prisma/orm-postgres/components";
import { Pencil, Trash, Ellipsis } from "lucide-react";
import { ActionDialog } from "@/components/custom/action-dialog";
import { DeleteSchoolForm } from "./delete-form";
import { EditSchoolForm } from "./edit-school-form";

type School = Scalars<Models.public_School>
type Option = { id: number; name: string }

type Participation = Pick<
    Scalars<Models.public_Participation>,
    "id" | "programId" | "startDate" | "endDate" | "status"
>

interface SchoolTableProps {
    data: School[]
    branches: Option[]
    programs: Option[]
    availableContacts: Option[]
    availableEmployees: Option[]
    relationsBySchool: Record<number, {
        contacts: Option[]
        employees: Option[]
        participations: Participation[]
    }>
}

export function SchoolTable({
    data,
    branches,
    programs,
    availableContacts,
    availableEmployees,
    relationsBySchool,
}: SchoolTableProps) {
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
                            <ActionDialog
                                contentClassName="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl"
                                icon={<Pencil />} 
                                content={
                                    <EditSchoolForm
                                        id={school.id}
                                        name={school.name}
                                        email={school.email}
                                        phone={school.phone}
                                        address={school.address}
                                        type={school.type}
                                        relationship={school.relationship}
                                        region={school.region}
                                        branchId={school.branchId}
                                        branches={branches}
                                        programs={programs}
                                        availableContacts={availableContacts}
                                        availableEmployees={availableEmployees}
                                        contacts={relationsBySchool[school.id].contacts}
                                        employees={relationsBySchool[school.id].employees}
                                        participations={relationsBySchool[school.id].participations}
                                        />
                                }
                            />
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
