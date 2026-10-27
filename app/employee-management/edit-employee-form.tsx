'use client'

import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEmployee, editEmployee } from "./actions"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"

const roles = [
    { label: "Admin", value: "ADMIN" },
    { label: "Workshops Coordinator", value: "WORKSHOPS_COORDINATOR" },
    { label: "School Network Coordinator", value: "SCHOOL_NETWORK_COORDINATOR" },
    { label: "Stories of our Neighbors Coordinator", value: "STORIES_OF_OUR_NEIGHBORS_COORDINATOR" },
    { label: "Veterans Day Coordinator", value: "VETERANS_DAY_COORDINATOR" },
    { label: "Newsletter Coordinator", value: "NEWSLETTER_COORDINATOR" },
]

type Role = Scalars<Models.public_Employee>["role"]


interface EditEmployeeFormProps {
    name: string,
    email: string
    phone: string,
    role: Role
}



// TODO: Add form validation
export function EditEmployeeForm(employee: EditEmployeeFormProps) {    // Add actual type later T_T
    return (
        <form className="flex flex-col gap-3" action={editEmployee}>
            <Field>
                <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                <Input 
                    name="full-name"
                    type="text"
                    required
                    value={employee.name}
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input 
                    name="email"
                    type="email"
                    value={employee.email}
                    required
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="phone-num">Phone Number</FieldLabel>
                <Input 
                    name="phone-num"
                    type="text"
                    value={employee.phone}
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select items={roles} defaultValue="" name="role">
                    <SelectTrigger>
                        <SelectValue 
                            placeholder={employee.role}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {roles.map((r) => {
                                return (
                                <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                </SelectItem>
                            )})}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field>

            <DialogClose render={<Button type="submit">Submit</Button>}/>
        </form>
    )
}