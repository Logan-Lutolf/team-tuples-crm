'use client'

import { Field, FieldLabel } from "@/components/ui/field";
import { deleteEmployee } from "./actions";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


interface DeleteEmployeeFormProps {
    employeeId: number;
    employeeName: string;
}

export function DeleteEmployeeForm({ employeeId, employeeName }: DeleteEmployeeFormProps) {
    return(
        <form action={deleteEmployee}>
            <Input type="hidden" name="employee-id" value={employeeId} />
            <Field>
                <FieldLabel>
                    Are you sure you want to delete {employeeName}? <br/> If so, type &apos;delete&apos; to confirm.
                </FieldLabel>
                <Input 
                    name='confirm-delete'
                    type='text'
                    required
                />
            </Field>
            <div className="flex flex-row justify-end gap-4 mt-3">
                <DialogClose render={<Button>Cancel</Button>}/>
                <DialogClose render={<Button type='submit' variant={"destructive"}>Delete</Button>}/>
            </div>
            
        </form>
    )
}