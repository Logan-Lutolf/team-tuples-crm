import { EmployeeTable } from "@/components/custom/employee-table";
import { db } from "@/prisma/db";
import { AddEmployeeForm } from "./add-employee-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


// Add pagination to employee list
// Add employee functionality
// Edit employee functionality
// Delete employee functionality
// Search functionality (basic)


export default async function EmployeeManagementPage() {
    
    const employees = await db.orm.public.Employee.all();

    return (
        <div className="flex flex-col gap-4 m-10">
            <Dialog>
                <DialogTrigger render={<Button>Add an Employee</Button>}/>

                <DialogContent>
                    <AddEmployeeForm />
                </DialogContent>
            </Dialog>
            <EmployeeTable employees={employees} />
        </div>
    )
}