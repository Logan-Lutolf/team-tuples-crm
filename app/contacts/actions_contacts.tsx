'use server'
import { db } from "@/prisma/db"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { revalidatePath } from "next/cache"

type Role = Scalars<Models.public_Contact>["contactRole"]


// TODO: Only ADMIN should be able to create new employee

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

export async function editEmployee(formData: FormData) {
    const name = formData.get("full-name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone-num") as string
    const role = formData.get("role") as Role

    if (name == null || email == null){
        console.log("Update employee failed: name or email is null")
        return
    }

    try {
        const employee = await db.orm.public.Employee
            .where({ email: email})
            .update({
                name: name,
                email: email,
                phone: phone,
                role: role,
            })
        
        if (employee) {
            console.log("Edit employee successful.")
            revalidatePath("/employee-management")
        }
    }
    catch (error) {
        console.log("Update employee faield: ", error)
    }

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