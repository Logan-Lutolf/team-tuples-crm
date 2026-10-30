'use server'
import { db } from "@/prisma/db"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { revalidatePath } from "next/cache"
import { ContactValidationError, contactFieldLabel, contactErrorMessage } from "./contact-errors"

type ContactFields = Scalars<Models.public_Contact>

// TODO: Only ADMIN should be able to create new employee
function text(form: FormData, key: string, required = true): string {
    const value = form.get(key)
    if (value !== null && typeof value !== "string") throw new ContactValidationError(`Choose or enter a valid ${contactFieldLabel(key).toLowerCase()}.`)
    const result = (value ?? "").trim()
    if (required && !result) throw new ContactValidationError(`${contactFieldLabel(key)} is required.`)
    return result
}


function id(form: FormData, key: string): number {
    const value = Number(text(form, key))
    if (!Number.isSafeInteger(value) || value <= 0) throw new ContactValidationError(`Choose or enter a valid ${contactFieldLabel(key).toLowerCase()}.`)
    return value
}

function choice<T extends string>(form: FormData, key: string, values: readonly T[]): T {
    const value = text(form, key)
    const match = values.find((candidate) => candidate === value)
    if (!match) throw new ContactValidationError(`Choose or enter a valid ${contactFieldLabel(key).toLowerCase()}.`)
    return match
}

function email(form: FormData): string {
    const value = text(form, "email")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new ContactValidationError("Enter a valid email address.")
    }
    return value
}

export async function createContact(formData: FormData) {
    return contactAction("Create contact", async () => {
        await db.orm.public.Contact.create({
            ...contactData(formData),
            address: addressData(formData),
            schoolId: text(formData, "school-id", false) ? id(formData, "school-id") : null,
        })
    })
}

function contactData(form: FormData) {
    return {
        // this form should only include singular fields (not like multiple contacts, employees, participations related to this)
        name: text(form, form.has("full-name") ? "full-name" : "name"),
        email: email(form),
        phone: text(form, "phone-num", false) || null,
        region: text(form, "region", false) ? choice<NonNullable<ContactFields["region"]>>(form, "region", [
            "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN",
            "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN",
        ]) : null,
        branchId: id(form, "branch"),
        // add contactRole
        contactRole: choice<ContactFields["contactRole"]>(form, "contactRole", [
            "TEACHER",
            "PRINCIPAL",
            "SCHOOL_COORDINATOR",
            "STUDENT",
            "HISTORIAN",
            "GOVERNMENT_OFFICIAL",
            "DONOR",
            "SPONSOR",
            "PARTNER",
            "VOLUNTEER",
            "OTHER",
        ])
        // done with this form
    }
}

function addressData(form: FormData) {
    if (!["street", "city", "country", "zipCode"].some((key) => text(form, key, false))) return undefined
    return {
        street: text(form, "street"),
        city: text(form, "city"),
        zipCode: text(form, "zipCode"),
    }
}

async function contactAction(label: string, action: () => Promise<void>) {
    try {
        await action()
    } catch (error) {
        console.error(`${label} failed:`, error)
        return { error: contactErrorMessage(error, label) }
    }
    revalidatePath("/contacts")
    return { success: true as const }
}

export async function editContact(formData: FormData) {
    return contactAction("Update contact", async () => {
        const contactId = id(formData, "contact-id")
        const data = contactData(formData)
        await db.transaction(async (tx) => {
            const contact = await tx.orm.public.Contact.where({ id: contactId }).first()
            if (!contact) throw new ContactValidationError("This contact no longer exists. Refresh the page.")
            await tx.orm.public.Contact.where({ id: contactId }).update({
                ...data,
                address: addressData(formData),
            })
        })
    })
}

export async function deleteContact(formData: FormData) {
    return contactAction("Delete school", async () => {
        const contactId = id(formData, "school-id")
        // Let foreign-key constraints prevent deleting schools with dependent records.
        await db.orm.public.Contact.where({ id: contactId }).delete()
    })
}

export async function addSchoolContact(formData: FormData) {
    return contactAction("Assign school", async () => {
        await db.orm.public.Contact.where({
            id: id(formData, "contact-id"),
            schoolId: null,
        }).update({ schoolId: id(formData, "school-id") })
    })
}

export async function removeSchoolContact(formData: FormData) {
    return contactAction("Remove school", async () => {
        await db.orm.public.Contact.where({
            id: id(formData, "contact-id"),
            schoolId: id(formData, "school-id"),
        }).update({ schoolId: null })
    })
}