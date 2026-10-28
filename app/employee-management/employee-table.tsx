import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Models } from "@/prisma/contract";
import { Button } from "@/components/ui/button"
import { Scalars } from "@prisma/orm-postgres/components";
import { Pencil, Trash, Ellipsis, SquareArrowOutUpRight } from "lucide-react";
import { ActionDialog } from "@/components/custom/action-dialog";
import { DeleteEmployeeForm } from "./forms/delete-form";
import { EditEmployeeForm } from "./forms/edit-employee-form";
import { ExtendedEmployee } from "./extended-employee";
import { BigActionDialog } from "@/components/custom/action-dialog";

type Employee = Scalars<Models.public_Employee>


export function EmployeeTable({data} : {data: Employee[]}) {
    return(
        <Table className="border border-black">
            <TableHeader className="rounded-4xl">
                <TableRow className="border border-black">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>

            <TableBody>
                {data.map((employee: Employee) => (
                    <TableRow key={employee.id} className="border border-black">
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell>
                            <div className="flex flex-row gap-2">
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
                                <BigActionDialog
                                    className="w-3/5"
                                    icon={ <SquareArrowOutUpRight />}
                                    content={
                                        <ExtendedEmployee 
                                            name={employee.name}
                                            role={employee.role}
                                            email={employee.email}
                                            phone={employee.phone ? employee.phone : "Unknown Phone Number"}
                                            region={employee.region ? employee.region : "Unkown Branch"} 
                                            id={employee.id}                                    />
                                    }
                                >
                                </BigActionDialog>
                            </div>
                            
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}