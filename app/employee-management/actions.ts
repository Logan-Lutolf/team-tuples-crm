'use server'
import { db } from "@/prisma/db"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { revalidatePath } from "next/cache"

type Role = Scalars<Models.public_Employee>["role"]


// TODO: Only ADMIN should be able to create new employee

export async function createEmployee(formData: FormData) {
    const name = formData.get("full-name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone-num") as string
    const role = formData.get("role") as Role
    
    
    if (name == null || email == null){
        console.log("Create employee failed: name or email is null")
        return {success: false, message: "Failed to create employee. Invalid name or email."}
    }
    
    try {
        const employee = await db.orm.public.Employee.create({
            name: name,
            email: email,
            phone: phone,
            role: role,
        })

        if(employee)
            console.log("Create employee successful.")
            revalidatePath("/employee-management")
            return {success: true, message: "Employee created successfully."}

        
    }
    catch (error) {
        console.log("Create employee failed: ", error)
        return {success: false, message: "Failed to create employee."}
    }
}

export async function editEmployee(formData: FormData) {
    const name = formData.get("full-name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone-num") as string
    const role = formData.get("role") as Role

    if (name == null || email == null){
        console.log("Update employee failed: name or email is null")
        return {success: false, message: "Update employee failed. Name or email cannot be null."}
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
            return {success: true, message: "Employee updated successfully."}
        }
        else
            return {success: false, message: "Update employee failed. Employee not found."}
    }
    catch (error) {
        console.log("Update employee failed: ", error)
        return {success: false, message: "Failed to update employee."}
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
            return {success: true, message: "Employee deleted successfully."}
    }
    catch (error) {
        console.log("Delete employee failed: ", error)
        return {success: false, message: "Failed to delete employee."}
    }
}