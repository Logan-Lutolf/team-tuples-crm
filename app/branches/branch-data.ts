import type { Models } from "@/prisma/contract"
import type { Scalars } from "@prisma/orm-postgres/components"

export type Branch = Scalars<Models.public_Branch>
export type EmployeeOption = { id: number; name: string; email: string }
export type BranchResult = { success: true } | { error: string }

export function positiveId(value: FormDataEntryValue | null, label: string): number {
    if (typeof value !== "string" || !/^\d+$/.test(value)) throw new Error(`Choose a valid ${label}.`)
    const id = Number(value)
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`Choose a valid ${label}.`)
    return id
}

export function branchData(form: FormData, names: readonly Branch["name"][], regions: readonly Branch["region"][]) {
    const name = names.find((value) => value === form.get("name"))
    const region = regions.find((value) => value === form.get("region"))
    if (!name) throw new Error("Choose a branch name.")
    if (!region) throw new Error("Choose a region.")
    const institute = form.get("institute")
    if (institute !== null && typeof institute !== "string") throw new Error("Enter a valid institute.")
    const chief = form.get("chiefId")
    return {
        name, region,
        institute: institute?.trim() || null,
        chiefId: chief === null || chief === "" ? null : positiveId(chief, "chief"),
    }
}
