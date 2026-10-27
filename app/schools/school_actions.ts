'use server'

import { db } from "@/prisma/db"
import { revalidatePath } from "next/cache"
import type { SchoolFormState } from "./school-form-types"

class ValidationError extends Error {}

function required(data: FormData, key: string, label: string) {
    const value = data.get(key)
    if (typeof value !== "string" || !value.trim()) {
        throw new ValidationError(`${label} is required.`)
    }
    return value.trim()
}

function positiveId(value: FormDataEntryValue | null, label: string) {
    if (typeof value !== "string" || !/^\d+$/.test(value)) {
        throw new ValidationError(`${label} must be a positive integer.`)
    }
    const id = Number(value)
    if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
        throw new ValidationError(`${label} must be a valid positive integer.`)
    }
    return id
}

function enumValue<T extends string>(value: string, values: readonly T[], label: string): T {
    const match = values.find((item) => item === value)
    if (!match) throw new ValidationError(`Choose a valid ${label}.`)
    return match
}

function dateValue(value: FormDataEntryValue | null, label: string) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new ValidationError(`${label} is required and must be a valid date.`)
    }
    const date = new Date(`${value}T00:00:00.000Z`)
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw new ValidationError(`${label} must be a valid date.`)
    }
    return date.toISOString()
}

export async function createSchool(
    _previousState: SchoolFormState,
    formData: FormData,
): Promise<SchoolFormState> {
    try {
        const enums = db.enums.public
        const id = positiveId(formData.get("id"), "School ID")
        const branchId = positiveId(formData.get("branchId"), "Branch")
        const name = required(formData, "name", "Name")
        const email = required(formData, "email", "Email")
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new ValidationError("Enter a valid email address.")
        }
        const phone = String(formData.get("phone") ?? "").trim()
        if (phone && !/^[+()\d.\s-]*\d[+()\d.\s-]*$/.test(phone)) {
            throw new ValidationError("Enter a valid phone number.")
        }
        const address = {
            street: required(formData, "street", "Street"),
            city: required(formData, "city", "City"),
            country: required(formData, "country", "Country"),
            zipCode: required(formData, "zipCode", "Postal code"),
        }
        const type = enumValue(required(formData, "type", "Type"), enums.SchoolType.values, "school type")
        const region = enumValue(required(formData, "region", "Region"), enums.Region.values, "region")
        const relationship = enumValue(required(formData, "relationship", "Relationship"), enums.RelationshipType.values, "relationship")
        const contactIds = [...new Set(formData.getAll("contactIds").map((value) => positiveId(value, "Contact")))]
        const employeeIds = [...new Set(formData.getAll("employeeIds").map((value) => positiveId(value, "Employee")))]
        const rowIds = formData.getAll("participationRows")
        if (rowIds.length > 100 || contactIds.length > 500 || employeeIds.length > 500) {
            throw new ValidationError("Too many related records selected.")
        }
        const participations = rowIds.map((value) => {
            const row = positiveId(value, "Participation row")
            const prefix = `participation.${row}`
            const startDate = dateValue(formData.get(`${prefix}.startDate`), "Start date")
            const endValue = formData.get(`${prefix}.endDate`)
            const endDate = endValue ? dateValue(endValue, "End date") : null
            if (endDate && endDate < startDate) {
                throw new ValidationError("End date must be on or after start date.")
            }
            return {
                programId: positiveId(formData.get(`${prefix}.programId`), "Program"),
                startDate,
                endDate,
                status: enumValue(required(formData, `${prefix}.status`, "Status"), enums.ProgramStatus.values, "status"),
            }
        })

        await db.transaction(async (tx) => {
            const orm = tx.orm.public
            if (!await orm.Branch.where({ id: branchId }).first()) {
                throw new ValidationError("The selected branch no longer exists.")
            }
            if (await orm.School.where({ id }).first()) {
                throw new ValidationError("A school with this ID already exists.")
            }
            if (await orm.School.where({ email }).first()) {
                throw new ValidationError("A school with this email already exists.")
            }
            await orm.School.create({ id, name, email, phone: phone || null, address, type, region, relationship, branchId })
            for (const employeeId of employeeIds) {
                if (!await orm.Employee.where({ id: employeeId }).first()) {
                    throw new ValidationError("A selected employee no longer exists.")
                }
                await orm.SchoolEmployees.create({ schoolId: id, employeeId })
            }
            for (const contactId of contactIds) {
                // The conditional update also protects against a concurrent assignment.
                await orm.Contact.where({ id: contactId, schoolId: null, branchId }).update({ schoolId: id })
                if (!await orm.Contact.where({ id: contactId, schoolId: id, branchId }).first()) {
                    throw new ValidationError("A selected contact is unavailable or belongs to another branch. Refresh and try again.")
                }
            }
            for (const participation of participations) {
                if (!await orm.Program.where({ id: participation.programId }).first()) {
                    throw new ValidationError("A selected program no longer exists.")
                }
                await orm.Participation.create({ ...participation, schoolId: id })
            }
        })
    } catch (error) {
        if (error instanceof ValidationError) return { success: false, message: error.message }
        console.error("Create school failed:", error)
        return { success: false, message: "Unable to create the school. Check for an existing ID or email and try again." }
    }

    revalidatePath("/schools")
    return { success: true, message: "School created successfully." }
}
