
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Models } from "@/prisma/contract";
import { Scalars } from "@prisma/orm-postgres/components";

type Contact = Scalars<Models.public_Contact>



export function SmallContactTable({data} : {data: Contact[]}) {
    return (
        <ScrollArea>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>School ID</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((contact) => {
                        return (
                            <TableRow>
                                <TableCell>{contact.name}</TableCell>
                                <TableCell>{contact.email}</TableCell>
                                <TableCell>{contact.phone ? contact.phone : "N/A"}</TableCell>
                                <TableCell>{contact.region ? contact.region : "N/A"}</TableCell>
                                <TableCell>{contact.schoolId ? contact.schoolId : "N/A"}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </ScrollArea>
        
    )
}