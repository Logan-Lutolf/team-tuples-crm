'use client'

import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEmployee, editEmployee } from "../actions"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { showToast } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"

type Role = Roles[number]

const rolesobj = [
    { label: "Admin", value: "ADMIN" },
    { label: "Marketer", value: "MARKETER" },
    { label: "Workshops Coordinator", value: "WORKSHOPS_COORDINATOR" },
    { label: "School Network Coordinator", value: "SCHOOL_NETWORK_COORDINATOR" },
    { label: "Stories of our Neighbors Coordinator", value: "STORIES_OF_OUR_NEIGHBORS_COORDINATOR" },
    { label: "Veterans Day Coordinator", value: "VETERANS_DAY_COORDINATOR" },
    { label: "Newsletter Coordinator", value: "NEWSLETTER_COORDINATOR" },
] as const satisfies readonly { label: string; value: Role }[]

type Roles = Scalars<Models.public_Employee>["roles"]


interface EditEmployeeFormProps {
    name: string,
    email: string
    phone: string,
    roles: Roles
    onSuccess?: () => void
}



// TODO: Add form validation
export function EditEmployeeForm({name, email, phone, roles, onSuccess}: EditEmployeeFormProps) {    // Add actual type later T_T
    async function handleSubmit(formData: FormData) { 
            const result = await editEmployee(formData)
            if (result.success) {
                showToast("Employee Updated", "Employee has been updated successfully.")
                onSuccess?.()
            } else {
                showToast("Failed to Update Employee", result.message, "error")
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

            <Accordion>
                <AccordionItem>
                    <AccordionTrigger>Select Roles:</AccordionTrigger>
                    <AccordionContent>
                        <FieldGroup className="gap-2">
                            {rolesobj.map((r) => {
                                return (
                                    <Field orientation="horizontal" key={r.value}>
                                        <Checkbox
                                            name="roles"
                                            defaultChecked={roles.includes(r.value) ? true : false}
                                            value={r.value}
                                        />
                                        
                                        <FieldLabel>{r.label}</FieldLabel>
                                    </Field>
                                )
                            })}
                        </FieldGroup>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <Button type="submit">Submit</Button>
        </form>
    )
}