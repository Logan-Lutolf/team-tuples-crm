import type { Scalars } from "@prisma/orm-postgres/components"
import type { Models } from "@/prisma/contract"

export type SchoolContact = Pick<Scalars<Models.public_Contact>,
    "id" | "name" | "email" | "phone" | "branchRole" | "subject">

export type Option = { id: number; name: string }

export type SchoolFormOptions = {
    branches: Option[]
    contacts: (Option & { branchId: number })[]
    employees: Option[]
    programs: Option[]
    regions: string[]
    types: string[]
    relationships: string[]
    statuses: string[]
}

export type SchoolFormState = {
    success: boolean
    message: string
}

export type SchoolEmployee = Pick<Scalars<Models.public_Employee>,
    "id" | "name" | "email" | "phone" | "role" | "region">
