'use client'

import { Button } from "@/components/ui/button"
import { useFormStatus } from "react-dom"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createOrganization } from "@/app/actions/organization"
import { showToast } from "@/lib/utils"

const regions = [
    { label: "PRAHA", value: "PRAHA" },
    { label: "STŘEDOČESKÝ", value: "STŘEDOČESKÝ" },
    { label: "JIHOČESKÝ", value: "JIHOČESKÝ" },
    { label: "PLZEŇSKÝ", value: "PLZEŇSKÝ" },
    { label: "KARLOVARSKÝ", value: "KARLOVARSKÝ" },
    { label: "ÚSTECKÝ", value: "ÚSTECKÝ" },
    { label: "LIBERECKÝ", value: "LIBERECKÝ" },
    { label: "KRÁLOVÉHRADECKÝ", value: "KRÁLOVÉHRADECKÝ" },
    { label: "PARDUBICKÝ", value: "PARDUBICKÝ" },
    { label: "JIHOMORAVSKÝ", value: "JIHOMORAVSKÝ" },
    { label: "OLOMOUCKÝ", value: "OLOMOUCKÝ" },
    { label: "ZLÍNSKÝ", value: "ZLÍNSKÝ" },
    { label: "MORAVSKOSLEZSKÝ", value: "MORAVSKOSLEZSKÝ" },
    { label: "JIHLAVA", value: "JIHLAVA" },
];


const types = [
    { label: "PRIMARY_SCHOOL", value: "PRIMARY_SCHOOL" },
    { label: "SECONDARY_SCHOOL", value: "SECONDARY_SCHOOL" },
    { label: "THEATRE", value: "THEATRE" },
    { label: "CULTURAL", value: "CULTURAL" },
]

const relationships = [
    { label: "POOR", value: "POOR"},
    { label: "AVERAGE", value: "AVERAGE"},
    { label: "EXCELLENT", value: "EXCELLENT"},
]

function SubmitButton() {
    const { pending } = useFormStatus()
    return <Button type="submit" disabled={pending} className="sm:col-span-2">{pending ? "Saving…" : "Submit"}</Button>
}

export function AddSchoolForm({ branches }: { branches: {name: string }[] }) {
    const branchOptions = branches.map((branch) => ({ label: branch.name, value: branch.name }))
    async function submit(formData: FormData) {
        let result = null
        try {
            result = await createOrganization(formData)
        } 
        catch (error) {
            console.log(error)
        }

        if (result != null) {
            if (result.result == "success") 
                showToast("Success", result.message as string, result.result as "error" | "success" | "warning" | undefined)
            else 
                showToast("Error", result.message as string, result.result as "error" | "success" | "warning" | undefined)
        }

    }
    return (
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&_[data-slot=select-trigger]]:w-full" action={submit}>
            <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input 
                    id="name"
                    name="name"
                    type="text"
                    required
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="street">Street address</FieldLabel>
                <Input id="street" name="street" required />
            </Field>

            <Field>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input id="city" name="city" required />
            </Field>
            <Field>
                <FieldLabel htmlFor="country">Country</FieldLabel>
                <Input id="country" name="country" required />
            </Field>

        
            <Field>
                <FieldLabel htmlFor="zipCode">Postal code</FieldLabel>
                <Input id="zipCode" name="zipCode" required />
            </Field>
            
            <Field>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <Select required items={types} defaultValue="" name="type">
                    <SelectTrigger>
                        <SelectValue />
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
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <Input 
                    name="phone"
                    type="text"
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
                <FieldLabel htmlFor="relationship">Relationship</FieldLabel>
                <Select required items={relationships} defaultValue="" name="relationship">
                    <SelectTrigger>
                        <SelectValue />
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
                <FieldLabel htmlFor="region">Region</FieldLabel>
                <Select required items={regions} defaultValue="" name="region">
                    <SelectTrigger>
                        <SelectValue />
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
            </Field>
            <SubmitButton />
        </form>
    )
}
