'use client'

import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { editSchool } from "./actions_schools"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"

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

const types = [
    { label: "PRIMARY", value: "PRIMARY" },
    { label: "SECONDARY", value: "SECONDARY" },
    { label: "UNDERGRADUATE", value: "UNDERGRADUATE" },
    { label: "GRADUATE", value: "GRADUATE" },
    { label: "POSTGRADUATE", value: "POSTGRADUATE" },
]

const relationships = [
    { label: "POOR", value: "POOR"},
    { label: "AVERAGE", value: "AVERAGE"},
    { label: "EXCELLENT", value: "EXCELLENT"},
]

type SchoolFields = Scalars<Models.public_School>

type Region = SchoolFields["region"]
type SchoolType = SchoolFields["type"]
type Relationship = SchoolFields["relationship"]
type BranchId = SchoolFields["branchId"] // number

interface EditSchoolFormProps {
    id: number
    name: string,
    type: SchoolType,
    phone: string | null,
    email: string,
    relationship: Relationship,
    region: Region,
    address: SchoolFields["address"], 
    branchId: SchoolFields["branchId"]
    branches: { id: number; name: string }[]
}



// TODO: Add form validation
export function EditSchoolForm(school: EditSchoolFormProps) {    // Add actual type later T_T
    const branchOptions = school.branches.map((branch) => ({
        label: branch.name,
        value: String(branch.id),
    }))

    return (
        <form className="flex flex-col gap-3" action={editSchool}>
            <input type="hidden" name="school-id" value={school.id} />

            <Field>
                <FieldLabel htmlFor="full-name">Name</FieldLabel>
                <Input 
                    id="full-name"
                    name="full-name"
                    type="text"
                    required
                    defaultValue={school.name}
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="street">Street address</FieldLabel>
                <Input id="street" name="street" defaultValue={school.address.street}/>
            </Field>

            <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input id="city" name="city" defaultValue={school.address.city}/>
            </Field>

            <Field>
                <FieldLabel htmlFor="zipCode">Postal code</FieldLabel>
                <Input id="zipCode" name="zipCode" defaultValue={school.address.zipCode}/>
            </Field>
            
            <Field>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <Select items={types} defaultValue={school.type} name="type">
                    <SelectTrigger>
                        <SelectValue 
                            placeholder={school.type}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {types.map((t) => {
                                return (
                                <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                </SelectItem>
                            )})}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field>


            <Field>
                <FieldLabel htmlFor="phone-num">Phone Number</FieldLabel>
                <Input 
                    name="phone-num"
                    type="text"
                    defaultValue={school.phone ?? ""}
                />
            </Field>
            

            <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input 
                    name="email"
                    type="email"
                    defaultValue={school.email}
                    required
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="relationship">Relationship</FieldLabel>
                <Select items={relationships} defaultValue={school.relationship} name="relationship">
                    <SelectTrigger>
                        <SelectValue 
                            placeholder={school.relationship}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {relationships.map((r) => {
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
                <FieldLabel htmlFor="role">Region</FieldLabel>
                <Select items={regions} defaultValue={school.region} name="region">
                    <SelectTrigger>
                        <SelectValue 
                            placeholder={school.region}
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
                    defaultValue={String(school.branchId)}
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

            <DialogClose render={<Button type="submit">Submit</Button>}/>
        </form>
    )
}