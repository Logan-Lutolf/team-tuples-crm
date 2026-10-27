'use client'

import { useActionState, useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createSchool } from "./school_actions"
import type { SchoolFormOptions } from "./school-form-types"

const selectClass = "w-full rounded-md border border-input bg-background p-2"

function EnumField({ name, label, values }: { name: string; label: string; values: string[] }) {
    return (
        <Field>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            <select id={name} name={name} required defaultValue="" className={selectClass}>
                <option value="" disabled>Choose {label.toLowerCase()}</option>
                {values.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
            </select>
        </Field>
    )
}

export function AddSchoolForm({ branches, contacts, employees, programs, regions, types, relationships, statuses }: SchoolFormOptions) {
    const [state, submit, actionPending] = useActionState(createSchool, { success: false, message: "" })
    const [transitionPending, startTransition] = useTransition()
    const [branchId, setBranchId] = useState("")
    const [rows, setRows] = useState<number[]>([])
    const nextRow = useRef(1)
    const pending = actionPending || transitionPending
    const availableContacts = contacts.filter((contact) => String(contact.branchId) === branchId)

    if (state.success) return <p role="status">{state.message}</p>

    return (
        <form className="flex flex-col gap-4" onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            startTransition(() => submit(data))
        }}>
            <fieldset disabled={pending} className="flex flex-col gap-3 disabled:opacity-60">
                <Field>
                    <FieldLabel htmlFor="id">School ID</FieldLabel>
                    <Input id="id" name="id" type="number" min={1} max={2147483647} step={1} required />
                </Field>
                <Field>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input id="name" name="name" required pattern=".*\S.*" />
                </Field>
                {[
                    ["street", "Street"], ["city", "City"], ["country", "Country"], ["zipCode", "Postal code"],
                ].map(([name, label]) => (
                    <Field key={name}>
                        <FieldLabel htmlFor={name}>{label}</FieldLabel>
                        <Input id={name} name={name} required pattern=".*\S.*" />
                    </Field>
                ))}
                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" name="email" type="email" required />
                </Field>
                <Field>
                    <FieldLabel htmlFor="phone">Phone number (optional)</FieldLabel>
                    <Input id="phone" name="phone" type="tel" pattern="[+()0-9.\s\-]*[0-9][+()0-9.\s\-]*" title="Use digits, spaces, +, parentheses, dots, or hyphens." />
                </Field>
                <EnumField name="type" label="School type" values={types} />
                <EnumField name="relationship" label="Relationship" values={relationships} />
                <EnumField name="region" label="Region" values={regions} />
                <Field>
                    <FieldLabel htmlFor="branchId">Branch</FieldLabel>
                    <select id="branchId" name="branchId" required className={selectClass} value={branchId} onChange={(event) => setBranchId(event.target.value)}>
                        <option value="" disabled>Choose a branch</option>
                        {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </select>
                    {branches.length === 0 && <p>Create a branch before adding a school.</p>}
                </Field>
                <fieldset className="flex flex-col gap-2" key={branchId}>
                    <legend className="mb-2 font-medium">Contacts (optional)</legend>
                    <p className="text-sm text-muted-foreground">Choose unassigned contacts from the selected branch.</p>
                    {availableContacts.map((contact) => (
                        <label key={contact.id} className="flex items-center gap-2">
                            <input type="checkbox" name="contactIds" value={contact.id} />{contact.name}
                        </label>
                    ))}
                    {availableContacts.length === 0 && <p className="text-sm">{branchId ? "No unassigned contacts in this branch." : "Choose a branch to see contacts."}</p>}
                </fieldset>
                <fieldset className="flex flex-col gap-2">
                    <legend className="mb-2 font-medium">Employees (optional)</legend>
                    {employees.map((employee) => (
                        <label key={employee.id} className="flex items-center gap-2">
                            <input type="checkbox" name="employeeIds" value={employee.id} />{employee.name}
                        </label>
                    ))}
                    {employees.length === 0 && <p className="text-sm">No employees available.</p>}
                </fieldset>
                <fieldset className="flex flex-col gap-3">
                    <legend className="mb-2 font-medium">Program participations (optional)</legend>
                    {rows.map((row) => {
                        const prefix = `participation.${row}`
                        return (
                            <fieldset key={row} className="flex flex-col gap-3 rounded-md border p-3">
                                <legend>Participation {rows.indexOf(row) + 1}</legend>
                                <input type="hidden" name="participationRows" value={row} />
                                <Field>
                                    <FieldLabel htmlFor={`${prefix}.programId`}>Program</FieldLabel>
                                    <select id={`${prefix}.programId`} name={`${prefix}.programId`} required defaultValue="" className={selectClass}>
                                        <option value="" disabled>Choose a program</option>
                                        {programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}
                                    </select>
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`${prefix}.startDate`}>Start date</FieldLabel>
                                    <Input id={`${prefix}.startDate`} name={`${prefix}.startDate`} type="date" required />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor={`${prefix}.endDate`}>End date (optional)</FieldLabel>
                                    <Input id={`${prefix}.endDate`} name={`${prefix}.endDate`} type="date" />
                                </Field>
                                <EnumField name={`${prefix}.status`} label="Status" values={statuses} />
                                <Button type="button" variant="outline" onClick={() => setRows((current) => current.filter((id) => id !== row))}>Remove participation</Button>
                            </fieldset>
                        )
                    })}
                    <Button type="button" variant="outline" disabled={programs.length === 0 || rows.length >= 100} onClick={() => {
                        const row = nextRow.current++
                        setRows((current) => [...current, row])
                    }}>Add participation</Button>
                    {programs.length === 0 && <p className="text-sm">Create a program to add participations.</p>}
                </fieldset>
                <Button type="submit" disabled={branches.length === 0}>{pending ? "Creating school…" : "Create school"}</Button>
            </fieldset>
            {state.message && <p role="alert" className="text-destructive">{state.message}</p>}
        </form>
    )
}
