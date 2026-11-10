import { DashboardTable } from '@/components/records/dashboard-table'
import { PageActionLink } from '@/components/records/page-action-link'
import { RecordLink } from '@/components/records/record-link'
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

import type { ContactFields } from "./contact-form-types";


interface ContactTableProps {
    data: ContactFields[]
}

export function ContactTable({
    data,
}: ContactTableProps) {
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
                {data.map((contact: ContactFields) => (
                    <TableRow key={contact.id}>
                        <TableCell><RecordLink type="contacts" id={contact.id}>{contact.name}</RecordLink></TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.phone}</TableCell>
                        <TableCell>
                            {contact.address
                                ? `${contact.address.street}, ${contact.address.zipCode}`
                                : "No address"}
                        </TableCell>
                        <TableCell><div className="flex flex-wrap items-center justify-center gap-2">
                            <PageActionLink href={`/details/contacts/${contact.id}`}>View details</PageActionLink>
                            <PageActionLink href={`/details/contacts/${contact.id}/delete`} destructive>Delete</PageActionLink>

                        </div></TableCell>
                    </TableRow>
                ))}
                {!data.length && <TableRow><TableCell colSpan={5} className="h-24">No results.</TableCell></TableRow>}
            </TableBody>
        </DashboardTable>
    )
}
