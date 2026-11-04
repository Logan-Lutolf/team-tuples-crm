'use server'

import { db } from "@/prisma/db"
import { recordInteraction } from "@/lib/record-interaction"
import type { Scalars } from "@prisma/orm-postgres/components"
import type { Models } from "@/prisma/contract"
import { revalidatePath } from "next/cache"
import { SchoolValidationError, schoolFieldLabel, schoolErrorMessage } from "./school-errors"

type SchoolFields = Scalars<Models.public_School>
type ParticipationFields = Scalars<Models.public_Participation>

// TODO: Enforce the application's administrator permission policy.

function text(form: FormData, key: string, required = true): string {
    const value = form.get(key)
    if (value !== null && typeof value !== "string") throw new SchoolValidationError(`Choose or enter a valid ${schoolFieldLabel(key).toLowerCase()}.`)
    const result = (value ?? "").trim()
    if (required && !result) throw new SchoolValidationError(`${schoolFieldLabel(key)} is required.`)
    return result
}

function id(form: FormData, key: string): number {
    const value = Number(text(form, key))
    if (!Number.isSafeInteger(value) || value <= 0) throw new SchoolValidationError(`Choose or enter a valid ${schoolFieldLabel(key).toLowerCase()}.`)
    return value
}

function choice<T extends string>(form: FormData, key: string, values: readonly T[]): T {
    const value = text(form, key)
    const match = values.find((candidate) => candidate === value)
    if (!match) throw new SchoolValidationError(`Choose or enter a valid ${schoolFieldLabel(key).toLowerCase()}.`)
    return match
}

function email(form: FormData): string {
    const value = text(form, "email")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new SchoolValidationError("Enter a valid email address.")
    }
    return value
}

function schoolData(form: FormData) {
    return {
        name: text(form, form.has("full-name") ? "full-name" : "name"),
        email: email(form),
        phone: text(form, "phone-num", false) || null,
        type: choice<SchoolFields["type"]>(form, "type", [
            "PRIMARY", "SECONDARY", "UNDERGRADUATE", "GRADUATE", "POSTGRADUATE",
        ]),
        relationship: choice<SchoolFields["relationship"]>(form, "relationship", [
            "POOR", "AVERAGE", "EXCELLENT",
        ]),
        region: choice<SchoolFields["region"]>(form, "region", [
            "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN",
            "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN",
        ]),
        branchId: id(form, "branch"),
    }
}

function addressData(form: FormData) {
    return {
        street: text(form, "street"),
        city: text(form, "city"),
        country: text(form, "country"),
        zipCode: text(form, "zipCode"),
    }
}

async function schoolAction(label: string, action: () => Promise<void>) {
    try {
        await action()
    } catch (error) {
        console.error(`${label} failed:`, error)
        return { error: schoolErrorMessage(error, label) }
    }
    revalidatePath("/schools")
    return { success: true as const }
}

export async function createSchool(formData: FormData) {
    try {
        const data = { ...schoolData(formData), address: addressData(formData) }
        // School IDs have no database default. Retry if concurrent creation claims the same ID.
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                await db.transaction(async (tx) => {
                    const lastSchool = await tx.orm.public.School
                        .orderBy((school) => school.id.desc()).first()
                    await tx.orm.public.School.create({ id: (lastSchool?.id ?? 0) + 1, ...data })
                })
                revalidatePath("/schools")
                return { success: true as const }
            } catch (error) {
                if (attempt === 2 || !(error instanceof Error) ||
                    !("sqlState" in error) || error.sqlState !== "23505" ||
                    !("constraint" in error) || error.constraint !== "School_pkey") throw error
            }
        }
    } catch (error) {
        console.error("Create school failed:", error)
        return { error: schoolErrorMessage(error, "Create school") }
    }
}

export async function editSchool(formData: FormData) {
    return schoolAction("Update school", async () => {
        const schoolId = id(formData, "school-id")
        const data = schoolData(formData)
        await db.transaction(async (tx) => {
            const school = await tx.orm.public.School.where({ id: schoolId }).first()
            if (!school) throw new SchoolValidationError("This school no longer exists. Refresh the page.")
            await tx.orm.public.School.where({ id: schoolId }).update({
                ...data,
                address: addressData(formData),
            })
        })
    })
}

export async function deleteSchool(formData: FormData) {
    return schoolAction("Delete school", async () => {
        const schoolId = id(formData, "school-id")
        // Let foreign-key constraints prevent deleting schools with dependent records.
        await db.orm.public.School.where({ id: schoolId }).delete()
    })
}

// Submit school-id and contact-id to associate an existing, unassigned contact.
export async function addSchoolContact(formData: FormData) {
    return schoolAction("Assign contact", async () => {
        await db.orm.public.Contact.where({
            id: id(formData, "contact-id"), schoolId: null,
        }).update({ schoolId: id(formData, "school-id") })
    })
}

// Detach the contact without deleting it or changing another school's contacts.
export async function removeSchoolContact(formData: FormData) {
    return schoolAction("Remove contact", async () => {
        await db.orm.public.Contact.where({
            id: id(formData, "contact-id"), schoolId: id(formData, "school-id"),
        }).update({ schoolId: null })
    })
}

// Dates must include a timezone, e.g. 2026-10-28T09:00:00Z.
function date(form: FormData, key: string, required: boolean): string | null {
    const value = text(form, key, required)
    if (!value) return null
    if (!/(Z|[+-]\d{2}:\d{2})$/i.test(value) || !Number.isFinite(Date.parse(value))) {
        throw new SchoolValidationError(`${schoolFieldLabel(key)} must be a valid date and time including a timezone.`)
    }
    return new Date(value).toISOString()
}

function participationData(form: FormData) {
    const startDate = date(form, "start-date", true)!
    const endDate = date(form, "end-date", false)
    if (endDate && endDate < startDate) throw new SchoolValidationError("End date must be on or after the start date.")
    return {
        name: text(form, "participation-name"),
        programId: id(form, "program-id"),
        startDate,
        endDate,
        status: choice<ParticipationFields["status"]>(form, "status", [
            "PLANNED", "ONGOING", "COMPLETED", "CANCELLED",
        ]),
    }
}

function participationEmployees(form: FormData) {
    return [...new Set(form.getAll('employee-ids').map(value => {
        if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new SchoolValidationError('Choose valid participating employees.')
        const employeeId = Number(value)
        if (!Number.isSafeInteger(employeeId) || employeeId <= 0) throw new SchoolValidationError('Choose valid participating employees.')
        return employeeId
    }))]
}

export async function createSchoolParticipation(formData: FormData) {
    return schoolAction("Create participation", async () => {
        const data = { schoolId: id(formData, "school-id"), ...participationData(formData) }
        const employeeIds = participationEmployees(formData)
        await db.transaction(async tx => {
            const participation = await tx.orm.public.Participation.create(data)
            for (const employeeId of employeeIds) {
                await tx.orm.public.ParticipationEmployees.create({ participationId: participation.id, employeeId })
            }
        })
        revalidatePath('/programs')
    })
}

export async function editSchoolParticipation(formData: FormData) {
    return schoolAction("Update participation", async () => {
        const where = { id: id(formData, "participation-id"), schoolId: id(formData, "school-id") }
        const data = participationData(formData)
        const employeeIds = participationEmployees(formData)
        await db.transaction(async tx => {
            const participation = await tx.orm.public.Participation.where(where).forUpdate().first()
            if (!participation) throw new SchoolValidationError('This participation no longer exists for this school. Refresh the page.')
            await tx.orm.public.Participation.where(where).update(data)
            await tx.orm.public.ParticipationEmployees.where({ participationId: participation.id }).delete()
            for (const employeeId of employeeIds) {
                await tx.orm.public.ParticipationEmployees.create({ participationId: participation.id, employeeId })
            }
        })
        revalidatePath('/programs')
    })
}

export async function deleteSchoolParticipation(formData: FormData) {
    return schoolAction("Delete participation", async () => {
        const participationId = id(formData, "participation-id")
        const schoolId = id(formData, "school-id")
        await db.transaction(async (tx) => {
            const participation = await tx.orm.public.Participation.where({
                id: participationId, schoolId,
            }).first()
            if (!participation) throw new SchoolValidationError("This participation no longer exists for this school. Refresh the page.")
            await tx.orm.public.ParticipationEmployees.where({ participationId }).delete()
            await tx.orm.public.Participation.where({ id: participationId, schoolId }).delete()
        })
    })
}

export async function recordSchoolInteraction(form: FormData) {
    return schoolAction('Record interaction', async () => {
        const schoolId = id(form, 'school-id')
        const employeeId = id(form, 'employee-id')
        const contactId = id(form, 'contact-id')
        const contactedAt = date(form, 'contacted-at', true)!
        if (Date.parse(contactedAt) > Date.now()) throw new SchoolValidationError('Contact date cannot be in the future.')
        const mode = choice(form, 'mode', db.enums.public.CommunicationMode.values)
        const programId = text(form, 'program-id', false) ? id(form, 'program-id') : null
        await db.transaction(tx => recordInteraction(tx, { schoolId, employeeId, contactId, programId, contactedAt, mode }))
        revalidatePath('/contacts')
    })
}

export async function getSchoolDetails(schoolId: number, editing = false) {
    if (!Number.isSafeInteger(schoolId) || schoolId <= 0) throw new Error("Invalid school ID.")
    const { loadSchoolDetails } = await import('./load-school-details')
    return loadSchoolDetails(schoolId, editing === true)
}

export async function createSchoolContact(form: FormData) {
    try {
        const schoolId = id(form, 'school-id')
        const school = await db.orm.public.School.where({ id: schoolId }).select('id', 'branchId', 'region').first()
        if (!school) return { error: 'This school no longer exists. Refresh the page.' }
        // Use persisted school values, rather than trusting submitted branch/region fields.
        const contact = new FormData()
        for (const key of ['full-name', 'email', 'phone-num', 'contactRole']) {
            const value = form.get(key)
            if (typeof value === 'string') contact.set(key, value)
        }
        contact.set('school-id', String(school.id))
        contact.set('branch', String(school.branchId))
        contact.set('region', school.region)
        const { createContact } = await import('../contacts/actions_contacts')
        const result = await createContact(contact)
        if ('success' in result) revalidatePath('/schools')
        return result
    } catch { return { error: 'Could not create this school contact. Check the fields and try again.' } }
}
