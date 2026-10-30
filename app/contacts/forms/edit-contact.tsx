'use client'

import { ContactActionForm } from "./contact-action-form"
import { Button } from "@/components/ui/button"
import { DialogHeader } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    editContact, addSchoolContact, removeSchoolContact,
   } from "../actions_contacts"
import type { Option } from "../contact-form-types"
import type { Scalars } from "@prisma/orm-postgres/components"
import type { Models } from "@/prisma/contract"

const regions = [
    { label: "ONE", value: "ONE" },
    { label: "TWO", value: "TWO" },
    { label: "THREE", value: "THREE" },
    { label: "FOUR", value: "FOUR" },
    { label: "FIVE", value: "FIVE" },
    { label: "SIX", value: "SIX" },
    { label: "SEVEN", value: "SEVEN" },
    { label: "EIGHT", value: "EIGHT" },
    { label: "NINE", value: "NINE" },
    { label: "TEN", value: "TEN" },
    { label: "ELEVEN", value: "ELEVEN" },
    { label: "TWELVE", value: "TWELVE" },
    { label: "THIRTEEN", value: "THIRTEEN" },
    { label: "FOURTEEN", value: "FOURTEEN" },
];

const contactRole = [
    { label: "Teacher", value: "TEACHER" },
    { label: "Principal", value: "PRINCIPAL" },
    { label: "School coordinator", value: "SCHOOL_COORDINATOR" },
    { label: "Student", value: "STUDENT" },
    { label: "Historian", value: "HISTORIAN" },
    { label: "Government official", value: "GOVERNMENT_OFFICIAL" },
    { label: "Donor", value: "DONOR" },
    { label: "Sponsor", value: "SPONSOR" },
    { label: "Partner", value: "PARTNER" },
    { label: "Volunteer", value: "VOLUNTEER" },
    { label: "Other", value: "OTHER" },
]

type ContactFields = Scalars<Models.public_Contact>

type Region = ContactFields["region"]


interface EditContactFormProps {
    id: number
    name: string,
    phone: string | null,
    email: string,
    region: Region,
    address: ContactFields["address"], 
    branchId: ContactFields["branchId"]
    branches: { id: number; name: string }[]
    contactRole: ContactFields["contactRole"]
    schoolId: ContactFields["schoolId"]
    availableSchools: Option[]
   
}



// TODO: Add form validation
export function EditContact(contact: EditContactFormProps) {    // Add actual type later T_T
    const branchOptions = contact.branches.map((branch) => ({
        label: branch.name,
        value: String(branch.id),
    }))

    return (
        <div className="flex flex-col gap-6">
        <DialogHeader>
        </DialogHeader>
        <ContactActionForm className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&_[data-slot=select-trigger]]:w-full [&>[role=alert]]:col-span-full [&>[role=status]]:col-span-full" action={editContact}>
            <input type="hidden" name="contact-id" value={contact.id} />

            <Field>
                <FieldLabel htmlFor="full-name">Name</FieldLabel>
                <Input 
                    id="full-name"
                    name="full-name"
                    type="text"
                    required
                    defaultValue={contact.name}
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="street">Street address</FieldLabel>
                <Input id="street" name="street" defaultValue={contact.address?.street ?? ""}/>
            </Field>

            <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input id="city" name="city" defaultValue={contact.address?.city ?? ""}/>
            </Field>

            <Field>
                <FieldLabel htmlFor="zipCode">Postal code</FieldLabel>
                <Input id="zipCode" name="zipCode" defaultValue={contact.address?.zipCode ?? ""}/>
            </Field>
            

            <Field>
                <FieldLabel htmlFor="phone-num">Phone Number</FieldLabel>
                <Input 
                    name="phone-num"
                    type="text"
                    defaultValue={contact.phone ?? ""}
                />
            </Field>
            

            <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input 
                    name="email"
                    type="email"
                    defaultValue={contact.email}
                    required
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="role">Region</FieldLabel>
                <Select items={regions} defaultValue={contact.region} name="region">
                    <SelectTrigger>
                        <SelectValue 
                            placeholder={contact.region ?? "Select region"}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {regions.map((r) => {
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
                <FieldLabel htmlFor="role">Branch</FieldLabel>
                <Select
                    items={branchOptions}
                    defaultValue={String(contact.branchId)}
                    name="branch"
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {branchOptions.map((branch) => (
                                <SelectItem key={branch.value} value={branch.value}>
                                    {branch.label}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field>

            <Field>
                <FieldLabel htmlFor="contact-role">Contact role</FieldLabel>
                <select id="contact-role" name="contactRole" required defaultValue={contact.contactRole} className="rounded-md border p-2">
                    {contactRole.map((role) => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                </select>
            </Field>

            <Button type="submit" className="sm:col-span-2">Save contact</Button>
        </ContactActionForm>

        <section className="flex flex-col gap-3">
            <h3 className="font-semibold">School</h3>
            <p>
                {contact.schoolId === null
                    ? "No school assigned"
                    : contact.availableSchools.find((school) => school.id === contact.schoolId)?.name
                        ?? `School ${contact.schoolId}`}
            </p>
            {contact.schoolId === null ? (
                contact.availableSchools.length > 0 ? (
                    <ContactActionForm action={addSchoolContact} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input type="hidden" name="contact-id" value={contact.id} />
                        <select name="school-id" aria-label="School" required defaultValue="" className="rounded-md border p-2">
                            <option value="" disabled>Select a school</option>
                            {contact.availableSchools.map((school) => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                            ))}
                        </select>
                        <Button type="submit">Assign school</Button>
                    </ContactActionForm>
                ) : <p>No schools available.</p>
            ) : (
                <ContactActionForm action={removeSchoolContact}>
                    <input type="hidden" name="contact-id" value={contact.id} />
                    <input type="hidden" name="school-id" value={contact.schoolId} />
                    <Button type="submit" variant="outline">Remove school</Button>
                </ContactActionForm>
            )}
        </section>
        </div>
    )
}
