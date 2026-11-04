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
                // Foreign keys preserve schools, contacts, and assignments that still use this branch.
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
            ? "This branch is still linked to schools, contacts, or employee assignments. Reassign them before deleting it."
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
