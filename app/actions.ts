'use server'
import { db } from "@/prisma/db"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { revalidatePath } from "next/cache"

type Role = Scalars<Models.public_Employee>["role"]

export async function createEmployee(formData: FormData) {
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
                country: '',
                zipCode: ''
            }
        })

        if(employee != undefined)
            console.log("Create employee successful.")
            revalidatePath("/employee-management")

        
    }
    catch (error) {
        console.log("Create employee failed: ", error)
    }
}