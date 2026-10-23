import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Models } from "@/prisma/contract";
import { Scalars } from "@prisma/orm-postgres/components";

type Employee = Scalars<Models.public_Employee>

export function EmployeeTable({employees}: {employees: Employee[]}) {
    return (
        <Table className="border border-black">
            <TableCaption>List of Employees</TableCaption>
            <TableHeader className="rounded-4xl">
                <TableRow className="border border-black">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone #</TableHead>
                    <TableHead>Role</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {employees.map((employee: any) => (
                    <TableRow key={employee.id} className="border border-black">
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.phone}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}