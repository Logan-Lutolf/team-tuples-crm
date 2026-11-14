'use server'
import { db } from "@/prisma/db"
import { revalidatePath } from "next/cache"
import { BranchTypes, RoleTypes } from "../types"
import { error } from "console"




// TODO: Only ADMIN should be able to create new employee
export async function createEmployee(formData: FormData) {
    const name = formData.get("full-name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone-num") as string
    const roles = formData.getAll("roles") as RoleTypes
    const otp = formData.get("otp") as string
    const dob = formData.get("dob") as string

    
    
    if (name == null || email == null){
        console.log("Create employee failed: name or email is null")
        return {success: false, message: "Failed to create employee. Invalid name or email."}
    }
    
    try {
        
        const person = await db.orm.public.Person.create({
            name,
            email,
            phone: phone || null,
            dob: dob
        })

        const employee = await db.orm.public.Employee.create({
            personId: person.id,
            password: otp,
            pfpImgUrl: "",
            role: roles,
        })

        // Possibly create employee assignments
        if (!person || !employee) {
            return {success: false, message: "Failed to create employee. Invalid name or email."}
        }


        revalidatePath("/employee-management")
        return { success: true, message: 'Employee created.' }
    } catch(error) { 
        console.log(error)
        return { success: false, message: 'Could not create employee. Check the fields and whether the email is already in use.' } 
    }
}

export async function editEmployee(formData: FormData) {
    const id = formData.get("id") as string
    const name = formData.get("full-name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone-num") as string
    const roles = formData.getAll("roles") as RoleTypes


    if (name == null || email == null){
        console.log("Update employee failed: name or email is null")
        return {success: false, message: "Update employee failed. Name or email cannot be null."}
    }

    try {
        const person = await db.orm.public.Person
            .where({email: email})
            .update({
                name: name,
                email: email,
                phone: phone,
            })
        
        const employee = await db.orm.public.Employee
            .where({ personId: Number(id)})
            .update({
                role: roles,
            })
        
        if (employee && person) {
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
            await tx.orm.public.Employee.where({ personId: id }).delete()
            await tx.orm.public.Person.where({id: id}).delete()
        })
        revalidatePath("/employee-management")
        return { success: true, message: 'Employee deleted.' }
    } catch { return { success: false, message: 'Could not delete employee. Check the database connection and automatic-deletion migration.' } }
}

export async function changePassword(formData: FormData) {
    const userId = formData.get("employee-id") as string
    const newPassword = formData.get("new-password") as string
    const confirmPassword = formData.get("confirm-password") as string

    if (newPassword !== confirmPassword) 
        return {success: false, message: "Passwords do not match."}
    else {
        try {
            const employee = await db.orm.public.Employee
            .where({personId: Number(userId)})
            .update({password: newPassword, mustChangePassword: false})

            if (employee) {
                revalidatePath("/dashboard")
                return {success: "success", message: "Password changed successfully."}
            }
            else
                return {success: "error", message: "Error changing password."}
        }
        catch (error) {
            return {success: "error", message: "Failed to change password: " + error}
        }
    }
}