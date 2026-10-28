'use server'

import { db } from "@/prisma/db"
import type { Scalars } from "@prisma/orm-postgres/components"
import type { Models } from "@/prisma/contract"
import { revalidatePath } from "next/cache"

type SchoolFields = Scalars<Models.public_School>
type ParticipationFields = Scalars<Models.public_Participation>

// TODO: Enforce the application's administrator permission policy.

function text(form: FormData, key: string, required = true): string {
    const value = form.get(key)
    if (value !== null && typeof value !== "string") throw new Error(`Invalid ${key}`)
    const result = (value ?? "").trim()
    if (required && !result) throw new Error(`Missing ${key}`)
    return result
}

function id(form: FormData, key: string): number {
    const value = Number(text(form, key))
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`Invalid ${key}`)
    return value
}

function choice<T extends string>(form: FormData, key: string, values: readonly T[]): T {
    const value = text(form, key)
    const match = values.find((candidate) => candidate === value)
    if (!match) throw new Error(`Invalid ${key}`)
    return match
}

function schoolData(form: FormData) {
    return {
        name: text(form, form.has("full-name") ? "full-name" : "name"),
        email: text(form, "email"),
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
        zipCode: text(form, "zipCode"),
    }
}

async function schoolAction(label: string, action: () => Promise<void>) {
    try {
        await action()
    } catch (error) {
        console.error(`${label} failed:`, error)
        throw new Error(`${label} failed. Check the submitted values and try again.`)
    }
    revalidatePath("/schools")
}

export async function createSchool(formData: FormData) {
    await schoolAction("Create school", async () => {
        await db.orm.public.School.create({
            ...schoolData(formData),
            address: addressData(formData),
        })
    })
}

export async function editSchool(formData: FormData) {
    await schoolAction("Update school", async () => {
        const schoolId = id(formData, "school-id")
        const data = schoolData(formData)
        await db.transaction(async (tx) => {
            const school = await tx.orm.public.School.where({ id: schoolId }).first()
            if (!school) throw new Error("School not found")
            await tx.orm.public.School.where({ id: schoolId }).update({
                ...data,
                address: addressData(formData),
            })
        })
    })
}

export async function deleteSchool(formData: FormData) {
    await schoolAction("Delete school", async () => {
        const schoolId = id(formData, "school-id")
        // Let foreign-key constraints prevent deleting schools with dependent records.
        await db.orm.public.School.where({ id: schoolId }).delete()
    })
}

// Submit school-id and contact-id to associate an existing, unassigned contact.
export async function addSchoolContact(formData: FormData) {
    await schoolAction("Assign contact", async () => {
        await db.orm.public.Contact.where({
            id: id(formData, "contact-id"), schoolId: null,
        }).update({ schoolId: id(formData, "school-id") })
    })
}

// Detach the contact without deleting it or changing another school's contacts.
export async function removeSchoolContact(formData: FormData) {
    await schoolAction("Remove contact", async () => {
        await db.orm.public.Contact.where({
            id: id(formData, "contact-id"), schoolId: id(formData, "school-id"),
        }).update({ schoolId: null })
    })
}

// Submit school-id and employee-id. Repeated assignments are safe.
export async function addSchoolEmployee(formData: FormData) {
    await schoolAction("Assign employee", async () => {
        const link = {
            schoolId: id(formData, "school-id"), employeeId: id(formData, "employee-id"),
        }
        await db.transaction(async (tx) => {
            const existing = await tx.orm.public.SchoolEmployees.where(link).first()
            if (!existing) await tx.orm.public.SchoolEmployees.create(link)
        })
    })
}

export async function removeSchoolEmployee(formData: FormData) {
    await schoolAction("Remove employee assignment", async () => {
        await db.orm.public.SchoolEmployees.where({
            schoolId: id(formData, "school-id"), employeeId: id(formData, "employee-id"),
        }).delete()
    })
}

// Dates must include a timezone, e.g. 2026-10-28T09:00:00Z.
function date(form: FormData, key: string, required: boolean): string | null {
    const value = text(form, key, required)
    if (!value) return null
    if (!/(Z|[+-]\d{2}:\d{2})$/i.test(value) || !Number.isFinite(Date.parse(value))) {
        throw new Error(`Invalid ${key}: include a timezone`)
    }
    return new Date(value).toISOString()
}

function participationData(form: FormData) {
    const startDate = date(form, "start-date", true)!
    const endDate = date(form, "end-date", false)
    if (endDate && endDate < startDate) throw new Error("End date precedes start date")
    return {
        programId: id(form, "program-id"),
        startDate,
        endDate,
        status: choice<ParticipationFields["status"]>(form, "status", [
            "PLANNED", "ONGOING", "COMPLETED", "CANCELLED",
        ]),
    }
}

export async function createSchoolParticipation(formData: FormData) {
    await schoolAction("Create participation", async () => {
        await db.orm.public.Participation.create({
            schoolId: id(formData, "school-id"), ...participationData(formData),
        })
    })
}

export async function editSchoolParticipation(formData: FormData) {
    await schoolAction("Update participation", async () => {
        await db.orm.public.Participation.where({
            id: id(formData, "participation-id"), schoolId: id(formData, "school-id"),
        }).update(participationData(formData))
    })
}

export async function deleteSchoolParticipation(formData: FormData) {
    await schoolAction("Delete participation", async () => {
        const participationId = id(formData, "participation-id")
        const schoolId = id(formData, "school-id")
        await db.transaction(async (tx) => {
            const participation = await tx.orm.public.Participation.where({
                id: participationId, schoolId,
            }).first()
            if (!participation) throw new Error("Participation not found for this school")
            await tx.orm.public.ParticipationEmployees.where({ participationId }).delete()
            await tx.orm.public.Participation.where({ id: participationId, schoolId }).delete()
        })
    })
}
