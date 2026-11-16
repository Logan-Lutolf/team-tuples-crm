'use server'

import { auditTransaction } from '@/lib/audit-transaction'
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
        await auditTransaction(tx => tx.orm.public.Contact.create({
            ...contactData(formData),
            address: addressData(formData),
            schoolId: text(formData, "school-id", false) ? id(formData, "school-id") : null,
        }))
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
        branchId: text(form, "branch", false) ? id(form, "branch") : null,
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
        country: text(form, "country"),
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
    revalidatePath("/schools")
    revalidatePath("/branches")
    return { success: true as const }
}

export async function editContact(formData: FormData) {
    return contactAction("Update contact", async () => {
        const contactId = id(formData, "contact-id")
        const data = contactData(formData)
        await auditTransaction(async (tx) => {
            const contact = await tx.orm.public.Contact.where({ id: contactId }).first()
            if (!contact) throw new ContactValidationError("This contact no longer exists. Refresh the page.")
            await tx.orm.public.Contact.where({ id: contactId }).update({
                ...data,
                address: addressData(formData),
            })
        }, { type: 'Contact', id: contactId, destinationBranchId: data.branchId })
    })
}

export async function deleteContact(formData: FormData) {
    return contactAction("Delete school", async () => {
        const contactId = id(formData, "school-id")
        // Let foreign-key constraints prevent deleting schools with dependent records.
        await auditTransaction(tx => tx.orm.public.Contact.where({ id: contactId }).delete())
    })
}

export async function addSchoolContact(formData: FormData) {
    return contactAction("Assign school", async () => {
        await auditTransaction(tx => tx.orm.public.Contact.where({
            id: id(formData, "contact-id"),
            schoolId: null,
        }).update({ schoolId: id(formData, "school-id") }))
    })
}

export async function removeSchoolContact(formData: FormData) {
    return contactAction("Remove school", async () => {
        await auditTransaction(tx => tx.orm.public.Contact.where({
            id: id(formData, "contact-id"),
            schoolId: id(formData, "school-id"),
        }).update({ schoolId: null }))
    })
}
export async function getContactDetails(contactId: number, editing = false, deferHistory = false) {
    if (!Number.isSafeInteger(contactId) || contactId <= 0) throw new Error('Invalid contact ID.')
    const { loadContactDetails } = await import('./load-contact-details')
    return loadContactDetails(contactId, editing === true, deferHistory === true)
}

export async function recordContactInteraction(form: FormData) {
    return contactAction('Record interaction', async () => {
        const contactId = id(form, 'contact-id')
        const employeeId = id(form, 'employee-id')
        const value = text(form, 'contacted-at')
        if (!/(Z|[+-]\d{2}:\d{2})$/i.test(value) || !Number.isFinite(Date.parse(value)) || Date.parse(value) > Date.now()) {
            throw new ContactValidationError('Enter a valid contact date that is not in the future.')
        }
        const contactedAt = new Date(value).toISOString()
        const mode = choice(form, 'mode', db.enums.public.CommunicationMode.values)
        const programId = text(form, 'program-id', false) ? id(form, 'program-id') : null
        const { recordInteraction } = await import('@/lib/record-interaction')
        await auditTransaction(async tx => {
            const contact = await tx.orm.public.Contact.where({ id: contactId }).forUpdate().first()
            if (!contact) throw new ContactValidationError('This contact no longer exists.')
            await recordInteraction(tx, { contactId, employeeId, programId, contactedAt, mode, schoolId: contact.schoolId })
        })
        revalidatePath('/schools')
        revalidatePath('/programs')
    })
}
