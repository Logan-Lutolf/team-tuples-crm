'use server'
import { db } from "@/prisma/db"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { revalidatePath } from "next/cache"
import { ContactValidationError, contactFieldLabel, contactErrorMessage } from "./contact-errors"

type Role = Scalars<Models.public_Contact>["contactRole"]


// TODO: Only ADMIN should be able to create new employee
function text(form: FormData, key: string, required = true): string {
    const value = form.get(key)
    if (value !== null && typeof value !== "string") throw new ContactValidationError(`Choose or enter a valid ${schoolFieldLabel(key).toLowerCase()}.`)
    const result = (value ?? "").trim()
    if (required && !result) throw new ContactValidationError(`${contactFieldLabel(key)} is required.`)
    return result
}


export async function createContact(formData: FormData) {
    const name = formData.get("full-name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone-num") as string
    const contactRole = formData.get("role") as Role
    
    
    if (name == null || email == null){
        console.log("Create contact failed: name or email is null")
        return
    }
    
    try {
        const contact = await db.orm.public.Contact.create({
            name: name,
            email: email,
            phone: phone,
            contactRole: contactRole,
            address: {   // This shouldn't be required by prisma contract; look into this
                street: '',
                city: '',
                zipCode: ''
            }
        })

        if(contact)
            console.log("Create contact successful.")
            revalidatePath("/contacts")

        
    }
    catch (error) {
        console.log("Create contact failed: ", error)
    }
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
    const id = formData.get('contact-id')

    if (id == null) 
        console.log("Delete contact failed: Contact ID does not exist.")

    const emp = Number(id)
    try {
        const deleted = await db.orm.public.Contact
            .where({id: emp})
            .delete()
        
        if (deleted)
            console.log("Deletion successful.")
            revalidatePath("/contacts")
    }
    catch (error) {
        console.log("Delete contact failed: ", error)
    }
}