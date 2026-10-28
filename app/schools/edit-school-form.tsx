'use client'

import { useEffect, useId, useRef } from "react"
import { SchoolActionForm, type SchoolFormAction } from "./school-action-form"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    editSchool, addSchoolContact, removeSchoolContact,
    addSchoolEmployee, removeSchoolEmployee,
    createSchoolParticipation, editSchoolParticipation, deleteSchoolParticipation,
} from "./actions_schools"
import type { Option } from "./school-form-types"
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
type Participation = Pick<Scalars<Models.public_Participation>,
    "id" | "programId" | "startDate" | "endDate" | "status">

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
    contacts: Option[]
    availableContacts: Option[] // Contacts not assigned to any school.
    employees: Option[] // Assigned employee records, rather than join records.
    availableEmployees: Option[]
    participations: Participation[]
    programs: Option[]
}



// TODO: Add form validation
export function EditSchoolForm(school: EditSchoolFormProps) {    // Add actual type later T_T
    const branchOptions = school.branches.map((branch) => ({
        label: branch.name,
        value: String(branch.id),
    }))

    return (
        <div className="flex flex-col gap-6">
        <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
        </DialogHeader>
        <SchoolActionForm className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&_[data-slot=select-trigger]]:w-full [&>[role=alert]]:col-span-full [&>[role=status]]:col-span-full" action={editSchool}>
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

            <Button type="submit" className="sm:col-span-2">Save school</Button>
        </SchoolActionForm>

        <SchoolAssignments
            schoolId={school.id} label="Contacts" field="contact-id"
            assigned={school.contacts} available={school.availableContacts}
            addAction={addSchoolContact} removeAction={removeSchoolContact}
        />
        <SchoolAssignments
            schoolId={school.id} label="Employees" field="employee-id"
            assigned={school.employees} available={school.availableEmployees}
            addAction={addSchoolEmployee} removeAction={removeSchoolEmployee}
        />

        <section className="flex flex-col gap-3">
            <h3 className="font-semibold">Participations</h3>
            {school.participations.length === 0 && <p>No participations yet.</p>}
            {school.participations.map((participation) => (
                <div key={participation.id} className="flex flex-col gap-3 rounded-md border p-3">
                    <SchoolParticipationForm schoolId={school.id} programs={school.programs} participation={participation} />
                    <SchoolActionForm action={deleteSchoolParticipation}>
                        <input type="hidden" name="school-id" value={school.id} />
                        <input type="hidden" name="participation-id" value={participation.id} />
                        <Button type="submit">Delete participation</Button>
                    </SchoolActionForm>
                </div>
            ))}
            <h4>Add participation</h4>
            {school.programs.length > 0
                ? <SchoolParticipationForm schoolId={school.id} programs={school.programs} />
                : <p>No programs available.</p>}
        </section>
        </div>
    )
}

// Separate forms keep relationship changes independent of school details.
function SchoolAssignments({ schoolId, label, field, assigned, available, addAction, removeAction }: {
    schoolId: number
    label: string
    field: string
    assigned: Option[]
    available: Option[]
    addAction: SchoolFormAction
    removeAction: SchoolFormAction
}) {
    const options = available.filter((option) => !assigned.some((item) => item.id === option.id))
    return (
        <section className="flex flex-col gap-3">
            <h3 className="font-semibold">{label}</h3>
            {assigned.length === 0 && <p>No {label.toLowerCase()} assigned.</p>}
            {assigned.map((item) => (
                <SchoolActionForm key={item.id} action={removeAction} className="flex items-center gap-3">
                    <input type="hidden" name="school-id" value={schoolId} />
                    <input type="hidden" name={field} value={item.id} />
                    <span>{item.name}</span>
                    <Button type="submit" aria-label={`Remove ${item.name}`}>Remove</Button>
                </SchoolActionForm>
            ))}
            {options.length > 0 ? (
                <SchoolActionForm action={addAction} className="flex flex-col gap-3">
                    <input type="hidden" name="school-id" value={schoolId} />
                    <Select name={field} defaultValue="" required
                        items={options.map((item) => ({ label: item.name, value: String(item.id) }))}>
                        <SelectTrigger aria-label={`Assign ${label.toLowerCase()}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {options.map((item) => (
                                    <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Button type="submit">Assign</Button>
                </SchoolActionForm>
            ) : <p>No additional {label.toLowerCase()} available.</p>}
        </section>
    )
}

function DateTimeField({ name, label, value, required = false }: {
    name: string
    label: string
    value?: string | null
    required?: boolean
}) {
    const id = useId()
    const input = useRef<HTMLInputElement>(null)
    useEffect(() => {
        if (!input.current) return
        if (!value) {
            input.current.value = ""
            return
        }
        const date = new Date(value)
        const pad = (part: number) => String(part).padStart(2, "0")
        input.current.value = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    }, [value])
    return (
        <Field>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input ref={input} id={id} name={`${name}-local`} type="datetime-local" step="1" required={required} />
        </Field>
    )
}

function SchoolParticipationForm({ schoolId, programs, participation }: {
    schoolId: number
    programs: Option[]
    participation?: Participation
}) {
    const programOptions = programs.map((program) => ({ label: program.name, value: String(program.id) }))
    if (participation && !programs.some((program) => program.id === participation.programId)) {
        programOptions.push({ label: `Program ${participation.programId}`, value: String(participation.programId) })
    }
    const statuses: Participation["status"][] = ["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"]
    async function submit(data: FormData) {
        for (const name of ["start-date", "end-date"]) {
            const value = String(data.get(`${name}-local`) ?? "")
            const date = value ? new Date(value) : null
            if (date && !Number.isFinite(date.getTime())) {
                return { error: "Choose a valid date and time." }
            }
            data.set(name, date ? date.toISOString() : "")
            data.delete(`${name}-local`)
        }
        return participation ? editSchoolParticipation(data) : createSchoolParticipation(data)
    }
    return (
        <SchoolActionForm action={submit} className="flex flex-col gap-3">
            <input type="hidden" name="school-id" value={schoolId} />
            {participation && <input type="hidden" name="participation-id" value={participation.id} />}
            <Field>
                <FieldLabel>Program</FieldLabel>
                <Select name="program-id" items={programOptions} required
                    defaultValue={participation ? String(participation.programId) : ""}>
                    <SelectTrigger aria-label="Program"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {programOptions.map((program) => (
                                <SelectItem key={program.value} value={program.value}>{program.label}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field>
            <DateTimeField name="start-date" label="Start date and time" value={participation?.startDate} required />
            <DateTimeField name="end-date" label="End date and time (optional)" value={participation?.endDate} />
            <Field>
                <FieldLabel>Status</FieldLabel>
                <Select name="status" defaultValue={participation?.status ?? "PLANNED"}
                    items={statuses.map((status) => ({ label: status, value: status }))}>
                    <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </Field>
            <Button type="submit">{participation ? "Save participation" : "Add participation"}</Button>
        </SchoolActionForm>
    )
}
