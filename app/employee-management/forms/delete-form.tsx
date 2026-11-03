'use client'

import { Field, FieldLabel } from "@/components/ui/field";
import { deleteEmployee } from "../actions";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/utils";



interface DeleteEmployeeFormProps {
    employeeId: number;
    employeeName: string;
    onSuccess?: () => void;
}

export function DeleteEmployeeForm({ employeeId, employeeName, onSuccess }: DeleteEmployeeFormProps) {
    
    
    async function handleSubmit(formData: FormData) {
        if (formData.get("confirm-delete") !== "delete") {
            showToast("Invalid Confirmation", "Please type 'delete' to confirm deletion.", "warning");
            return;
        }
        else {
            const result = await deleteEmployee(formData);
            if (result.success) {
                showToast("Employee Deleted", `Employee ${employeeName} has been deleted successfully.`);
            } else {
                showToast("Delete Failed", result.message, "error");
            }
            onSuccess?.();
        }
    }
    
    return(
        <form action={handleSubmit}>
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
                <Button type='submit' variant={"destructive"}>Delete</Button>
            </div>
            
        </form>
    )
}