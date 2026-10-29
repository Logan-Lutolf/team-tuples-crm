'use client'

import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createEmployee } from "../actions"

const roles = [
  { label: "Teacher", value: "TEACHER" },
  { label: "Principal", value: "PRINCIPAL" },
  { label: "School Coordinator", value: "SCHOOL_COORDINATOR" },
  { label: "Student", value: "STUDENT" },
  { label: "Historian", value: "HISTORIAN" },
  { label: "Government Official", value: "GOVERNMENT_OFFICIAL" },
  { label: "Donor", value: "DONOR" },
  { label: "Sponsor", value: "SPONSOR" },
  { label: "Partner", value: "PARTNER" },
  { label: "Volunteer", value: "VOLUNTEER" },
  { label: "Other", value: "OTHER" },
];


// TODO: Add form validation
export function AddContactForm() {    
    return (
        <form className="flex flex-col gap-3" action={createContact}>
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
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select items={roles} defaultValue="" name="role">
                    <SelectTrigger>
                        <SelectValue />
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
