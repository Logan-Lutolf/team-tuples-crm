'use server'
import { db } from "@/prisma/db"
import { revalidatePath } from "next/cache"

function employeeData(form: FormData) {
    const name = String(form.get('full-name') ?? '').trim()
    const email = String(form.get('email') ?? '').trim()
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a name and valid email.')
    const roles = [...new Set(form.getAll('role'))].map(value => {
        const role = db.enums.public.EmployeeJobRole.values.find(role => role === value)
        if (!role) throw new Error('Choose a valid role.')
        return role
    })
    return { data: { name, email, phone: String(form.get('phone-num') ?? '').trim() || null }, roles }
}
function employeeId(form: FormData) {
    const id = Number(form.get('employee-id'))
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid employee ID.')
    return id
}
function refresh() {
    for (const path of ['/employee-management', '/schools', '/contacts', '/branches']) revalidatePath(path)
}
export async function createEmployee(form: FormData) {
    try {
        const { data, roles } = employeeData(form)
        await db.transaction(async tx => {
            const employee = await tx.orm.public.Employee.create(data)
            for (const role of roles) await tx.orm.public.EmployeeAssignment.create({ employeeId: employee.id, role })
        })
        refresh()
        return { success: true, message: 'Employee created.' }
    } catch { return { success: false, message: 'Could not create employee. Check the fields and whether the email is already in use.' } }
}
export async function editEmployee(form: FormData) {
    try {
        const id = employeeId(form)
        const { data, roles } = employeeData(form)
        await db.transaction(async tx => {
            if (!await tx.orm.public.Employee.where({ id }).first()) throw new Error('Employee not found.')
            await tx.orm.public.Employee.where({ id }).update(data)
            // Only global assignments are edited here. Preserve branch/program/region assignments.
            await tx.orm.public.EmployeeAssignment.where({ employeeId: id, branchId: null, programId: null, region: null }).delete()
            for (const role of roles) await tx.orm.public.EmployeeAssignment.create({ employeeId: id, role })
        })
        refresh()
        return { success: true, message: 'Employee updated.' }
    } catch { return { success: false, message: 'Could not update employee. Check the fields and whether the email is already in use.' } }
}
export async function deleteEmployee(form: FormData) {
    try {
        const id = employeeId(form)
        await db.transaction(async tx => {
            await tx.orm.public.EmployeeAssignment.where({ employeeId: id }).delete()
            // Foreign keys protect interaction history, chiefs, and participation/legacy links.
            await tx.orm.public.Employee.where({ id }).delete()
        })
        refresh()
        return { success: true, message: 'Employee deleted.' }
    } catch { return { success: false, message: 'Could not delete employee. They may still be referenced by contact history, a branch, or participation.' } }
}
