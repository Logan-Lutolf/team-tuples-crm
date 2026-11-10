'use server'
import { Models } from "@/prisma/contract"
import { db } from "@/prisma/db"
import { Scalars } from "@prisma/orm-postgres/components"
import { revalidatePath } from "next/cache"

type Roles = Scalars<Models.public_Employee>["roles"]


// TODO: Only ADMIN should be able to create new employee
export async function createEmployee(formData: FormData) {
    const name = formData.get("full-name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone-num") as string
    const roles = formData.getAll("roles") as Roles
    const otp = formData.get("otp") as string

    
    
    if (name == null || email == null){
        console.log("Create employee failed: name or email is null")
        return {success: false, message: "Failed to create employee. Invalid name or email."}
    }
    
    try {
        const employee = await db.orm.public.Employee.create({
            name: name,
            email: email,
            phone: phone,
            password: otp,
            roles: roles,
        })
        revalidatePath("/employee-management")
        return { success: true, message: 'Employee created.' }
    } catch { return { success: false, message: 'Could not create employee. Check the fields and whether the email is already in use.' } }
}

export async function editEmployee(formData: FormData) {
    const name = formData.get("full-name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone-num") as string
    const roles = formData.getAll("roles") as Roles


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
                roles: roles,
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
export async function deleteEmployee(form: FormData) {
    try {
        const raw = form.get("employee-id")
        const id = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN

        if (!Number.isInteger(id)) {
            return { success: false, message: "Invalid employee ID." }
        }

        await db.transaction(async tx => {
            await tx.orm.public.EmployeeAssignment.where({ employeeId: id }).delete()
            // Delete actions clear chiefs/history references and remove participation links.
            await tx.orm.public.Employee.where({ id }).delete()
        })
        revalidatePath("/employee-management")
        return { success: true, message: 'Employee deleted.' }
    } catch { return { success: false, message: 'Could not delete employee. Check the database connection and automatic-deletion migration.' } }
}

