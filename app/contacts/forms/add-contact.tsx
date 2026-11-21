'use client'

import { Button } from "@/components/ui/button"
import { ContactActionForm } from "./contact-action-form"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createContact } from "../actions_contacts"
import { OrganizationSearch } from "@/components/custom/searches/organization-search"
import { CustomSelect } from "@/components/custom/custom-dropdowns"
import { CONTACT_TYPES } from "@/app/types"
import { createPerson } from "@/app/actions/person"
import { showToast } from "@/lib/utils"

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
    branches: { name: string }[]
    schools: { id: number; name: string }[]
}) {   
    const branchOptions = branches.map((branch) => ({ label: branch.name, value: branch.name }))
    const schoolOptions = schools.map((school) => ({ label: school.name, value: String(school.id) }))

    async function handleSubmit(formData: FormData) {
        const result = await createPerson(formData)
        
        if (result?.result == "Success") showToast(result.result, result.message, "success")
        else showToast(result?.result ?? "Error", result?.message ?? "Unkown error.", "error")
    }



    return (
        <form  className="flex flex-col gap-3" action={handleSubmit}>
            <Field>
                <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                <Input 
                    id="name"
                    name="name"
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
                    id="phone"
                    name="phone"
                    type="text"
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="role">Role</FieldLabel>
                <CustomSelect name={"role"} type={CONTACT_TYPES} />
            </Field>

            {/* <Field>
                <FieldLabel htmlFor="branch">Branch</FieldLabel>
                <Select items={[{ label: "No branch assigned", value: "" }, ...branchOptions]} defaultValue="" name="branch">
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="">No branch assigned</SelectItem>
                            {branchOptions.map((b) => {
                                return (
                                <SelectItem key={b.value} value={b.value}>
                                    {b.label}
                                </SelectItem>
                            )})}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field> */}

            <Field>
                <FieldLabel htmlFor="school">Organization</FieldLabel>
                <OrganizationSearch />
            </Field>

            <Button type="submit">Submit</Button>
        </form>
    )
}
