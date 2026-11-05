'use server'

import { revalidatePath } from "next/cache"
import { db } from "@/prisma/db"
import { branchData, positiveId, type BranchResult } from "./branch-data"

async function mutate(form: FormData, mode: "create" | "edit" | "delete"): Promise<BranchResult> {
    try {
        const id = mode === "create" ? null : positiveId(form.get("id"), "branch")
        if (mode === "delete" && form.get("confirmation") !== "delete") {
            return { error: "Type delete to confirm." }
        }
        const data = mode === "delete" ? null : branchData(form, db.enums.public.Branches.values, db.enums.public.Region.values)
        await db.transaction(async (tx) => {
            if (id !== null && !await tx.orm.public.Branch.where({ id }).first()) {
                throw new Error("This branch no longer exists. Refresh the page.")
            }
            if (mode === "delete") {
                // Schools and contacts are detached; scoped assignment links are removed by the database.
                await tx.orm.public.Branch.where({ id: id! }).delete()
            } else if (data) {
                if (data.chiefId !== null && !await tx.orm.public.Employee.where({ id: data.chiefId }).first()) {
                    throw new Error("The selected chief no longer exists. Refresh the page.")
                }
                if (mode === "create") await tx.orm.public.Branch.create(data)
                else await tx.orm.public.Branch.where({ id: id! }).update(data)
            }
        })
    } catch (error) {
        const state = error && typeof error === "object" && "sqlState" in error ? error.sqlState : undefined
        if (state === "23503") return { error: mode === "delete"
            ? "Could not clear a related link. Confirm the automatic-deletion migration has been applied and try again."
            : "The selected chief no longer exists. Refresh the page." }
        if (state === "23505") return { error: "A branch with these details already exists." }
        if (state || !(error instanceof Error)) return { error: "Could not save changes. Check the database setup and try again." }
        // Only return our validation messages, not raw driver errors or connection details.
        if (/^(Choose |Enter |This branch |The selected chief )/.test(error.message)) return { error: error.message }
        console.error("Branch action failed", error)
        return { error: "Could not save changes. Check the database setup and try again." }
    }
    for (const path of ["/branches", "/schools", "/contacts", "/employee-management"]) revalidatePath(path)
    return { success: true }
}

export async function createBranch(form: FormData) { return mutate(form, "create") }
export async function editBranch(form: FormData) { return mutate(form, "edit") }
export async function deleteBranch(form: FormData) { return mutate(form, "delete") }

export async function getBranchDetails(branchId: number, editing = false) {
    branchId = positiveId(String(branchId), 'branch')
    const [branch, contacts, assignments, schools] = await Promise.all([
        db.orm.public.Branch.where({ id: branchId }).first(),
        db.orm.public.Contact.where({ branchId }).select('id', 'name', 'email', 'phone', 'contactRole', 'schoolId').all().toArray(),
        db.orm.public.EmployeeAssignment.where({ branchId }).all().toArray(),
        db.orm.public.School.where({ branchId }).select('id', 'name').all().toArray(),
    ])
    if (!branch) throw new Error('This branch no longer exists.')
    const employeeIds = [...new Set([...assignments.map(a => a.employeeId), ...(branch.chiefId ? [branch.chiefId] : [])])]
    const programIds = [...new Set(assignments.flatMap(a => a.programId ? [a.programId] : []))]
    const [employees, programs, otherContacts, branches] = await Promise.all([
        editing ? db.orm.public.Employee.select('id', 'name', 'email', 'phone').all().toArray() : employeeIds.length ? db.orm.public.Employee.where(e => e.id.in(employeeIds)).select('id', 'name', 'email', 'phone').all().toArray() : [],
        editing ? db.orm.public.Program.select('id', 'name').all().toArray() : programIds.length ? db.orm.public.Program.where(p => p.id.in(programIds)).select('id', 'name').all().toArray() : [],
        editing ? db.orm.public.Contact.where(c => c.branchId.neq(branchId)).select('id', 'name', 'email').all().toArray() : [],
        editing ? db.orm.public.Branch.select('id', 'name').all().toArray() : [],
    ])
    return { branch, contacts, assignments, schools, employees, programs, otherContacts, branches,
        names: [...db.enums.public.Branches.values], regions: [...db.enums.public.Region.values],
        roles: [...db.enums.public.EmployeeJobRole.values], contactRoles: [...db.enums.public.ContactRole.values] }
}

export async function updateBranchRelationship(form: FormData): Promise<BranchResult> {
    try {
        const branchId = positiveId(form.get('branch-id'), 'branch')
        const operation = form.get('operation')
        await db.transaction(async tx => {
            if (!await tx.orm.public.Branch.where({ id: branchId }).first()) throw new Error('Branch missing')
            if (operation === 'assign-contact') {
                const contactId = positiveId(form.get('contact-id'), 'contact')
                if (!await tx.orm.public.Contact.where({ id: contactId }).first()) throw new Error('Contact missing')
                await tx.orm.public.Contact.where({ id: contactId }).update({ branchId })
            } else if (operation === 'move-contact') {
                const contactId = positiveId(form.get('contact-id'), 'contact')
                const destination = positiveId(form.get('destination'), 'destination branch')
                if (!await tx.orm.public.Contact.where({ id: contactId, branchId }).first()) throw new Error('Contact moved')
                await tx.orm.public.Contact.where({ id: contactId, branchId }).update({ branchId: destination })
            } else if (operation === 'edit-contact') {
                const contactId = positiveId(form.get('contact-id'), 'contact')
                const name = String(form.get('name') ?? '').trim()
                const email = String(form.get('email') ?? '').trim()
                const contactRole = db.enums.public.ContactRole.values.find(r => r === form.get('contactRole'))
                if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !contactRole) throw new Error('Invalid contact')
                if (!await tx.orm.public.Contact.where({ id: contactId, branchId }).first()) throw new Error('Contact moved')
                await tx.orm.public.Contact.where({ id: contactId, branchId }).update({ name, email, phone: String(form.get('phone') ?? '').trim() || null, contactRole })
            } else if (operation === 'edit-employee') {
                const employeeId = positiveId(form.get('employee-id'), 'employee')
                const assignment = await tx.orm.public.EmployeeAssignment.where({ branchId, employeeId }).first()
                const branch = await tx.orm.public.Branch.where({ id: branchId }).first()
                if (!assignment && branch?.chiefId !== employeeId) throw new Error('Employee not assigned')
                const name = String(form.get('name') ?? '').trim()
                const email = String(form.get('email') ?? '').trim()
                if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid employee')
                await tx.orm.public.Employee.where({ id: employeeId }).update({ name, email, phone: String(form.get('phone') ?? '').trim() || null })
            } else if (operation === 'add-assignment' || operation === 'edit-assignment') {
                const employeeId = positiveId(form.get('employee-id'), 'employee')
                const role = db.enums.public.EmployeeJobRole.values.find(r => r === form.get('role'))
                const regionValue = form.get('region')
                const region = regionValue ? db.enums.public.Region.values.find(r => r === regionValue) : null
                if (!role || (regionValue && !region)) throw new Error('Invalid assignment')
                const programId = form.get('program-id') ? positiveId(form.get('program-id'), 'program') : null
                const data = { employeeId, branchId, role, region: region ?? null, programId }
                if (operation === 'add-assignment') {
                    const existing = await tx.orm.public.EmployeeAssignment.where(data).first()
                    if (!existing) await tx.orm.public.EmployeeAssignment.create(data)
                } else {
                    const assignmentId = positiveId(form.get('assignment-id'), 'assignment')
                    if (!await tx.orm.public.EmployeeAssignment.where({ id: assignmentId, branchId }).first()) throw new Error('Assignment missing')
                    await tx.orm.public.EmployeeAssignment.where({ id: assignmentId, branchId }).update(data)
                }
            } else if (operation === 'remove-assignment') {
                await tx.orm.public.EmployeeAssignment.where({ id: positiveId(form.get('assignment-id'), 'assignment'), branchId }).delete()
            } else throw new Error('Invalid operation')
        })
    } catch {
        return { error: 'Could not update this relationship. Check the fields, email uniqueness, and that the selected records still exist.' }
    }
    for (const path of ['/branches', '/schools', '/contacts', '/employee-management', '/programs']) revalidatePath(path)
    return { success: true }
}
