import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Models } from "@/prisma/contract";
import { Button } from "@/components/ui/button"
import { Scalars } from "@prisma/orm-postgres/components";
import { Pencil, Trash, Ellipsis } from "lucide-react";

type Employee = Scalars<Models.public_Employee>


export function EmployeeTable({data} : {data: Employee[]}) {
    return(
        <Table className="border border-black">
            <TableHeader className="rounded-4xl">
                <TableRow className="border border-black">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone #</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {data.map((employee: any) => (
                    <TableRow key={employee.id} className="border border-black">
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.phone}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell className="flex flex-row gap-2">
                            <Button size="sm">
                                <Pencil/>
                            </Button>
                            <Button size="sm" variant="destructive">
                                <Trash/>
                            </Button>
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