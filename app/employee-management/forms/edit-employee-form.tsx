'use client'

import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEmployee, editEmployee } from "../actions"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { showToast } from "@/lib/utils"

const roles = [
    { label: "Admin", value: "ADMIN" },
    { label: "Workshops Coordinator", value: "WORKSHOPS_COORDINATOR" },
    { label: "School Network Coordinator", value: "SCHOOL_NETWORK_COORDINATOR" },
    { label: "Stories of our Neighbors Coordinator", value: "STORIES_OF_OUR_NEIGHBORS_COORDINATOR" },
    { label: "Veterans Day Coordinator", value: "VETERANS_DAY_COORDINATOR" },
    { label: "Newsletter Coordinator", value: "NEWSLETTER_COORDINATOR" },
]




interface EditEmployeeFormProps {
    name: string,
    email: string
    phone: string,
    id: number
    globalRoles: string[]
    onSuccess?: () => void
}



// TODO: Add form validation
export function EditEmployeeForm({id, name, email, phone, globalRoles, onSuccess}: EditEmployeeFormProps) {    // Add actual type later T_T
    async function handleSubmit(formData: FormData) { 
            const result = await editEmployee(formData)
            if (result.success) {
                showToast("Employee Updated", "Employee has been updated successfully.")
                onSuccess?.()
            } else {
                showToast("Failed to Update Employee", result.message)
            }
    }

    return (
        

        <form className="flex flex-col gap-3" action={handleSubmit}>
            <input type="hidden" name="employee-id" value={id} />
            <Field>
                <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                <Input 
                    name="full-name"
                    type="text"
                    required
                    defaultValue={name}
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input 
                    name="email"
                    type="email"
                    defaultValue={email}
                    required
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="phone-num">Phone Number</FieldLabel>
                <Input 
                    name="phone-num"
                    type="text"
                    defaultValue={phone}
                />
            </Field>

            <fieldset className="grid gap-2">
                <legend>Global roles</legend>
                {roles.map(role => <label key={role.value} className="flex items-center gap-2">
                    <input type="checkbox" name="role" value={role.value} defaultChecked={globalRoles.includes(role.value)} />{role.label}
                </label>)}
                <p className="text-sm text-muted-foreground">Branch, program, and regional assignments are kept separately.</p>
            </fieldset>

            <Button type="submit">Submit</Button>
        </form>
    )
}