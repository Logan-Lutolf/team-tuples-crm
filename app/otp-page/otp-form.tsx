"use client"

import { Button } from "@/components/ui/button";
import { changePassword } from "../employee-management/actions";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/utils";
import { redirect } from "next/navigation";




export function OtpForm({employeeId}: {employeeId: number}) {
    async function handleSubmit(formData: FormData) {
        const result = await changePassword(formData)
        
        if (result.success === "success"){
            showToast("Success", result.message, "success")
            redirect("/dashboard")
        } 
        else showToast("Error", result.message, "error")
    }
    
    return (    
            <form action={handleSubmit} className="flex flex-col gap-4 w-full">
                <Field>
                    <Input hidden value={employeeId} name="employee-id"/>
                </Field>
                <Field>
                    <FieldLabel>Enter a new password: </FieldLabel>
                    <Input 
                        name="new-password"
                        type="password"
                    />
                </Field>
                <Field>
                    <FieldLabel>Confirm new password:</FieldLabel>
                    <Input 
                        name="confirm-password"
                        type="password"
                    />
                </Field>
                <Button type="submit">Submit</Button>
            </form>
    )
}