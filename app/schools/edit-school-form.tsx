'use client'

import { useEffect, useId, useRef, useState, Fragment } from "react"
import { SchoolActionForm, type SchoolFormAction } from "./school-action-form"
import { Button } from "@/components/ui/button"
import { DialogHeader } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    editSchool, addSchoolContact, removeSchoolContact,
    addSchoolEmployee, removeSchoolEmployee,
    createSchoolParticipation, editSchoolParticipation, deleteSchoolParticipation,
} from "./actions_schools"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import type { Option, SchoolContact, SchoolEmployee } from "./school-form-types"
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
    "id" | "programId" | "startDate" | "endDate" | "status"> & { employees: SchoolEmployee[] }

interface EditSchoolFormProps {
    participationAsOf: number
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
    contacts: SchoolContact[]
    availableContacts: Option[] // Contacts not assigned to any school.
    employees: SchoolEmployee[] // Assigned employee records, rather than join records.
    availableEmployees: Option[]
    participations: Participation[]
    programs: Option[]
}



// TODO: Add form validation
export function EditSchoolForm(school: EditSchoolFormProps) {    // Add actual type later T_T
    const [viewingParticipants, setViewingParticipants] = useState<number | null>(null)
    const [editingParticipation, setEditingParticipation] = useState<number | null>(null)
    const branchOptions = school.branches.map((branch) => ({
        label: branch.name,
        value: String(branch.id),
    }))

    const upcoming = school.participations.filter((participation) =>
        participation.status === "PLANNED" && Date.parse(participation.startDate) > school.participationAsOf)
        .sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))
    const upcomingIds = new Set(upcoming.map((participation) => participation.id))
    const participationSections = [
        { title: "Upcoming participations", items: upcoming, empty: "No upcoming participations." },
        { title: "Past participations", items: school.participations.filter((participation) => !upcomingIds.has(participation.id)), empty: "No other participations yet." },
    ]

    return (
        <div className="flex flex-col gap-6">
        <DialogHeader>
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
            schoolId={school.id} label="School Contacts" field="contact-id"
            assigned={school.contacts} available={school.availableContacts} contactDetails={school.contacts}
            addAction={addSchoolContact} removeAction={removeSchoolContact}
        />
        <SchoolAssignments
            schoolId={school.id} label="Post Bellum Employees" field="employee-id"
            assigned={school.employees} available={school.availableEmployees} employeeDetails={school.employees}
            addAction={addSchoolEmployee} removeAction={removeSchoolEmployee}
        />

        <section className="flex flex-col gap-3">
            {participationSections.map(({ title, items, empty }) => (
            <section key={title} className="flex flex-col gap-3">
            <h3 className="font-semibold">{title}</h3>
            <Table className="border rounded-md">
                <TableHeader>
                    <TableRow>
                        <TableHead>Program</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{empty}</TableCell></TableRow>}
                    {items.map((participation) => (
                        <Fragment key={participation.id}>
                            <TableRow>
                                <TableCell className="font-medium">{school.programs.find((program) => program.id === participation.programId)?.name ?? `Program ${participation.programId}`}</TableCell>
                                <TableCell><LocalDateTime value={participation.startDate} /></TableCell>
                                <TableCell>{participation.endDate ? <LocalDateTime value={participation.endDate} /> : "—"}</TableCell>
                                <TableCell><span className="rounded-md bg-muted px-2 py-1 text-xs">{participation.status.charAt(0) + participation.status.slice(1).toLowerCase()}</span></TableCell>
                                <TableCell>
                                    <div className="flex items-start justify-end gap-2">
                                        <Button type="button" size="sm" variant="outline"
                                            aria-expanded={viewingParticipants === participation.id}
                                            aria-controls={`participation-${participation.id}-participants`}
                                            onClick={() => setViewingParticipants(viewingParticipants === participation.id ? null : participation.id)}>
                                            {viewingParticipants === participation.id ? "Hide participants" : "View participants"}
                                        </Button>
                                        <Button type="button" size="sm" variant="outline" aria-expanded={editingParticipation === participation.id}
                                            onClick={() => setEditingParticipation(editingParticipation === participation.id ? null : participation.id)}>
                                            {editingParticipation === participation.id ? "Close edit" : "Edit"}
                                        </Button>
                                        <SchoolActionForm action={deleteSchoolParticipation}>
                                            <input type="hidden" name="school-id" value={school.id} />
                                            <input type="hidden" name="participation-id" value={participation.id} />
                                            <Button type="submit" size="sm" variant="destructive">Delete</Button>
                                        </SchoolActionForm>
                                    </div>
                                </TableCell>
                            </TableRow>
                            {viewingParticipants === participation.id && <TableRow>
                                <TableCell colSpan={5} className="bg-muted/30 p-4 whitespace-normal">
                                    <section id={`participation-${participation.id}-participants`} className="flex flex-col gap-3" aria-label="Participation employees">
                                        <h4 className="font-semibold">Participation employees</h4>
                                        <Table className="border bg-background">
                                            <TableHeader><TableRow>
                                                <TableHead>Name</TableHead><TableHead>Email</TableHead>
                                                <TableHead>Phone</TableHead><TableHead>Role</TableHead><TableHead>Region</TableHead>
                                            </TableRow></TableHeader>
                                            <TableBody>
                                                {participation.employees.length === 0 && <TableRow>
                                                    <TableCell colSpan={5} className="text-center text-muted-foreground">No employees assigned to this participation.</TableCell>
                                                </TableRow>}
                                                {participation.employees.map((employee) => <TableRow key={employee.id}>
                                                    <TableCell className="font-medium">{employee.name}</TableCell>
                                                    <TableCell><a className="underline underline-offset-4" href={`mailto:${employee.email}`}>{employee.email}</a></TableCell>
                                                    <TableCell>{employee.phone ? <a href={`tel:${employee.phone}`}>{employee.phone}</a> : "—"}</TableCell>
                                                    <TableCell className="whitespace-normal">{employee.role.replaceAll("_", " ")}</TableCell>
                                                    <TableCell>{employee.region}</TableCell>
                                                </TableRow>)}
                                            </TableBody>
                                        </Table>
                                    </section>
                                </TableCell>
                            </TableRow>}
                            {editingParticipation === participation.id && <TableRow>
                                <TableCell colSpan={5} className="bg-muted/30 p-4 whitespace-normal">
                                    <SchoolParticipationForm schoolId={school.id} programs={school.programs} participation={participation} />
                                </TableCell>
                            </TableRow>}
                        </Fragment>
                    ))}
                </TableBody>
            </Table>
            </section>
            ))}
            <h3 className="font-semibold">Add participation</h3>
            {school.programs.length > 0
                ? <SchoolParticipationForm schoolId={school.id} programs={school.programs} />
                : <p>No programs available.</p>}
        </section>
        </div>
    )
}

// Separate forms keep relationship changes independent of school details.
function SchoolAssignments({ schoolId, label, field, assigned, available, addAction, removeAction, contactDetails, employeeDetails }: {
    schoolId: number
    label: string
    field: string
    assigned: Option[]
    available: Option[]
    contactDetails?: SchoolContact[]
    employeeDetails?: SchoolEmployee[]
    addAction: SchoolFormAction
    removeAction: SchoolFormAction
}) {
    const options = available.filter((option) => !assigned.some((item) => item.id === option.id))
    return (
        <section className="flex flex-col gap-3">
            <h3 className="font-semibold">{label}</h3>
            {contactDetails ? (
                <Table className="border rounded-md">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Contact role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contactDetails.length === 0 && (
                            <TableRow><TableCell colSpan={5} className="text-muted-foreground text-center">No contacts assigned.</TableCell></TableRow>
                        )}
                        {contactDetails.map((contact) => (
                            <TableRow key={contact.id}>
                                <TableCell className="font-medium">{contact.name}</TableCell>
                                <TableCell><a className="underline underline-offset-4" href={`mailto:${contact.email}`}>{contact.email}</a></TableCell>
                                <TableCell>{contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : "—"}</TableCell>
                                <TableCell>
                                    <div>{contact.contactRole.replaceAll("_", " ")}</div>
                                </TableCell>
                                <TableCell>
                                    <SchoolActionForm action={removeAction} className="flex flex-col items-end gap-2">
                                        <input type="hidden" name="school-id" value={schoolId} />
                                        <input type="hidden" name={field} value={contact.id} />
                                        <Button type="submit" size="sm" variant="outline" aria-label={`Remove ${contact.name}`}>Remove</Button>
                                    </SchoolActionForm>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <Table className="border rounded-md">
                    <TableHeader><TableRow>
                        <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead><TableHead>Region</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                        {employeeDetails?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No employees assigned.</TableCell></TableRow>}
                        {employeeDetails?.map((employee) => <TableRow key={employee.id}>
                            <TableCell className="font-medium">{employee.name}</TableCell>
                            <TableCell><a className="underline underline-offset-4" href={`mailto:${employee.email}`}>{employee.email}</a></TableCell>
                            <TableCell>{employee.phone ? <a href={`tel:${employee.phone}`}>{employee.phone}</a> : "—"}</TableCell>
                            <TableCell className="whitespace-normal">{employee.role.replaceAll("_", " ")}</TableCell>
                            <TableCell>{employee.region}</TableCell>
                            <TableCell>
                                <SchoolActionForm action={removeAction} className="flex flex-col items-end gap-2">
                                    <input type="hidden" name="school-id" value={schoolId} />
                                    <input type="hidden" name={field} value={employee.id} />
                                    <Button type="submit" size="sm" variant="outline" aria-label={`Remove ${employee.name}`}>Remove</Button>
                                </SchoolActionForm>
                            </TableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
            )}
            {options.length > 0 ? (
                <SchoolActionForm action={addAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input type="hidden" name="school-id" value={schoolId} />
                    <Select name={field} defaultValue="" required
                        items={options.map((item) => ({ label: item.name, value: String(item.id) }))}>
                        <SelectTrigger className="w-full sm:flex-1" aria-label={`Assign ${label.toLowerCase()}`}><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
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

function LocalDateTime({ value }: { value: string }) {
    const element = useRef<HTMLTimeElement>(null)
    useEffect(() => {
        if (element.current) element.current.textContent = new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    }, [value])
    return <time ref={element} dateTime={value}>{value.replace("T", " ").slice(0, 16)}</time>
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
