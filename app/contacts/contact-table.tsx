import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import type { Models } from "@/prisma/contract";
import { Button } from "@/components/ui/button"
import type { Scalars } from "@prisma/orm-postgres/components";
import { Pencil, Trash, Ellipsis } from "lucide-react";
import { ActionDialog } from "@/components/custom/action-dialog";
import { DeleteContactForm } from "./forms/delete-contact";
import { EditContactForm } from "./forms/edit-contact";

import type { ContactFields, Option } from "./contact-form-types";

type Contact = Scalars<Models.public_Contact>

interface ContactTableProps {
    data: ContactFields[]
    branches: Option[]
    availableSchools: Option[]
}

export function ContactTable({
    data,
    branches,
    availableSchools,
}: ContactTableProps) {
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
                {data.map((contact: ContactFields) => (
                    <TableRow key={contact.id} className="border border-black">
                        <TableCell>{contact.name}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.phone}</TableCell>
                        <TableCell>
                            {contact.address
                                ? `${contact.address.street}, ${contact.address.zipCode}`
                                : "No address"}
                        </TableCell>
                        <TableCell className="flex flex-row gap-2">
                            <ActionDialog
                                contentClassName="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[min(90vw,80rem)]"
                                icon={<Pencil />} 
                                content={
                                    <EditSchoolForm
                                        participationAsOf={participationAsOf}
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
