import type { Scalars } from "@prisma/orm-postgres/components"
import type { Models } from "@/prisma/contract"

export type ContactFields = Scalars<Models.public_Contact>

export type Option = {
    id: number
    name: string
}

export type ContactFormOptions = {
    branches: Option[]
    schools: (Option & { branchId: number })[]
}

export type ContactFormState = {
    success: boolean
    message: string
}