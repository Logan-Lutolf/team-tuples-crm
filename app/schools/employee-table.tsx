import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Models } from "@/prisma/contract";
import { Button } from "@/components/ui/button"
import { Scalars } from "@prisma/orm-postgres/components";
import { Pencil, Trash, Ellipsis } from "lucide-react";
import { ActionDialog } from "@/components/custom/action-dialog";
import { DeleteEmployeeForm } from "./delete-form";
import { EditEmployeeForm } from "./edit-employee-form";

type School = Scalars<Models.public_School>


export function EmployeeTable({data} : {data: School[]}) {
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
                        <TableCell>{school.address}</TableCell>
                        <TableCell className="flex flex-row gap-2">
                            <ActionDialog 
                                icon={<Pencil />} 
                                content={
                                    <EditEmployeeForm 
                                        name={employee.name}
                                        email={employee.email}
                                        phone={employee.phone ? employee.phone : ""}  // Might change this later
                                        role={employee.role}
                                    />
                                }
                            />
                            <ActionDialog
                                icon={<Trash />}
                                content={<DeleteEmployeeForm employeeId={employee.id} employeeName={employee.name} />}
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