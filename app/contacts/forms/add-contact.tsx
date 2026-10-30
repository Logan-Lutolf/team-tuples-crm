'use client'

import { Button } from "@/components/ui/button"
import { ContactActionForm } from "./contact-action-form"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createContact } from "../actions_contacts"

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


export function AddContactForm({
    branches,
    schools,
}: {
    branches: { id: number; name: string }[]
    schools: { id: number; name: string }[]
}) {   
    const branchOptions = branches.map((branch) => ({ label: branch.name, value: String(branch.id) }))
    const schoolOptions = schools.map((school) => ({ label: school.name, value: String(school.id) }))

    return (
        <ContactActionForm className="flex flex-col gap-3" action={createContact}>
            <Field>
                <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                <Input 
                    id="full-name"
                    name="full-name"
                    type="text"
                    required
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input 
                    id="email"
                    name="email"
                    type="email"
                    required
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="phone-num">Phone Number</FieldLabel>
                <Input 
                    id="phone-num"
                    name="phone-num"
                    type="text"
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <Select required items={roles} defaultValue="" name="contactRole">
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

            <Field>
                <FieldLabel htmlFor="branch">Branch</FieldLabel>
                <Select required items={branchOptions} defaultValue="" name="branch">
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {branchOptions.map((b) => {
                                return (
                                <SelectItem key={b.value} value={b.value}>
                                    {b.label}
                                </SelectItem>
                            )})}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field>

            <Field>
                <FieldLabel htmlFor="school">School</FieldLabel>
                <Select items={schoolOptions} defaultValue="" name="school-id">
                    <SelectTrigger>
                        <SelectValue placeholder="No school assigned" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="">No school assigned</SelectItem>
                            {schoolOptions.map((s) => {
                                return (
                                <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                </SelectItem>
                            )})}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field>

            <Button type="submit">Submit</Button>
        </ContactActionForm>
    )
}
