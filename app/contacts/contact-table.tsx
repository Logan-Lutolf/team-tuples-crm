import { PageActionLink } from '@/components/records/page-action-link'
import { RecordLink } from '@/components/records/record-link'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import type { Models } from "@/prisma/contract";
import { Button } from "@/components/ui/button"
import type { Scalars } from "@prisma/orm-postgres/components";
import { Trash, Ellipsis } from "lucide-react";

import type { ContactFields } from "./contact-form-types";

type Contact = Scalars<Models.public_Contact>

interface ContactTableProps {
    data: ContactFields[]
}

export function ContactTable({
    data,
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
                        <TableCell><RecordLink type="contacts" id={contact.id}>{contact.name}</RecordLink></TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.phone}</TableCell>
                        <TableCell>
                            {contact.address
                                ? `${contact.address.street}, ${contact.address.zipCode}`
                                : "No address"}
                        </TableCell>
                        <TableCell className="flex flex-row gap-2">
                            <PageActionLink href={`/details/contacts/${contact.id}`}>View details</PageActionLink>
                            <PageActionLink href={`/details/contacts/${contact.id}/delete`} destructive>Delete</PageActionLink>
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
