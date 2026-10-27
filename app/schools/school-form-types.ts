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
