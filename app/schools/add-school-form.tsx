'use client'

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createSchool } from "./actions_schools"

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

function SubmitButton() {
    const { pending } = useFormStatus()
    return <Button type="submit" disabled={pending} className="sm:col-span-2">{pending ? "Saving…" : "Submit"}</Button>
}

export function AddSchoolForm({ branches }: { branches: { id: number; name: string }[] }) {
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const branchOptions = branches.map((branch) => ({ label: branch.name, value: String(branch.id) }))
    async function submit(formData: FormData) {
        setError(null)
        setSaved(false)
        try {
            const result = await createSchool(formData)
            if (result?.error) setError(result.error)
            else setSaved(true)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Could not create school. Please try again.")
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
                <FieldLabel htmlFor="phone-num">Phone Number</FieldLabel>
                <Input 
                    name="phone-num"
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

            {saved && <p role="status" className="text-green-700 dark:text-green-400 sm:col-span-2">School created successfully.</p>}
            {error && <p role="alert" className="text-destructive sm:col-span-2">{error}</p>}
            <SubmitButton />
        </form>
    )
}
