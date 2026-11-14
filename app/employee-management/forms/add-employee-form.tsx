'use client'

import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createEmployee } from "../actions"
import { showToast } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePickerDemo } from "@/components/custom/date-picker"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const rolesobj = [
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
            showToast("Failed to Create Employee", result.message, "error")
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

            <Field>
                <FieldLabel>Date of Birth</FieldLabel>
                {/* Implement this later <DatePickerDemo /> */}
                <Input 
                    name="dob"
                    type="date"
                    placeholder="yyyy-mm-dd"
                />
            </Field>

            {/* <Select name="branch">
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem>PRAHA</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select> */}

            <Accordion>
                <AccordionItem>
                    <AccordionTrigger>Select Roles:</AccordionTrigger>
                    <AccordionContent keepMounted>
                        <FieldGroup className="gap-2">
                            {rolesobj.map((r) => {
                                return (
                                    <Field orientation="horizontal" key={r.label}>
                                        <Checkbox
                                            name={"roles"}
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
            <Field>
                <FieldLabel htmlFor="otp">One-Time Password</FieldLabel>
                <Input type="text" required name="otp"/>
            </Field>
            

            <DialogClose render={<Button type="submit">Submit</Button>}/>
        </form>
    )
}