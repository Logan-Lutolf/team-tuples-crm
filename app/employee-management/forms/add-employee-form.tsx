'use client'

import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEmployee } from "../actions"
import { showToast } from "@/lib/utils"

const roles = [
    { label: "Admin", value: "ADMIN" },
    { label: "Workshops Coordinator", value: "WORKSHOPS_COORDINATOR" },
    { label: "School Network Coordinator", value: "SCHOOL_NETWORK_COORDINATOR" },
    { label: "Stories of our Neighbors Coordinator", value: "STORIES_OF_OUR_NEIGHBORS_COORDINATOR" },
    { label: "Veterans Day Coordinator", value: "VETERANS_DAY_COORDINATOR" },
    { label: "Newsletter Coordinator", value: "NEWSLETTER_COORDINATOR" },
]

interface AddEmployeeFormProps {
    onSuccess?: () => void
}

// TODO: Add form validation
export function AddEmployeeForm({ onSuccess }: AddEmployeeFormProps) {    
    async function handleSubmit(formData: FormData) {
        const result = await createEmployee(formData)
        if (result.success == true) {
            showToast("Employee Created", `Employee has been created successfully.`)
            onSuccess?.()
        }
        else {
            showToast("Failed to Create Employee", result.message)
            return
        }
    }

    return (
        <form className="flex flex-col gap-3" action={handleSubmit}>
            <Field>
                <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                <Input 
                    name="full-name"
                    type="text"
                    required
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input 
                    name="email"
                    type="email"
                    required
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="phone-num">Phone Number</FieldLabel>
                <Input 
                    name="phone-num"
                    type="text"
                />
            </Field>

            <fieldset className="grid gap-2">
                <legend>Global roles</legend>
                {roles.map(role => <label key={role.value} className="flex items-center gap-2">
                    <input type="checkbox" name="role" value={role.value}  />{role.label}
                </label>)}
                <p className="text-sm text-muted-foreground">Branch, program, and regional assignments are kept separately.</p>
            </fieldset>

            <Button type="submit">Submit</Button>
        </form>
    )
}
