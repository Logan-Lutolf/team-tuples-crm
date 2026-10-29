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
    const role = formData.get("role") as Role
    
    
    if (name == null || email == null){
        console.log("Create employee failed: name or email is null")
        return
    }
    
    try {
        const employee = await db.orm.public.Employee.create({
            name: name,
            email: email,
            phone: phone,
            role: role,
            address: {   // This shouldn't be required by prisma contract; look into this
                street: '',
                city: '',
                zipCode: ''
            }
        })

        if(employee)
            console.log("Create employee successful.")
            revalidatePath("/employee-management")

        
    }
    catch (error) {
        console.log("Create employee failed: ", error)
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

export async function deleteEmployee(formData: FormData) {
    const id = formData.get('employee-id')

    if (id == null) 
        console.log("Delete employee failed: Employee ID does not exist.")

    const emp = Number(id)
    try {
        const deleted = await db.orm.public.Employee
            .where({id: emp})
            .delete()
        
        if (deleted)
            console.log("Deletion successful.")
            revalidatePath("/employee-management")
    }
    catch (error) {
        console.log("Delete employee failed: ", error)
    }
}