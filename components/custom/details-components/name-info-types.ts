import type { Branch, Organization, Person, PersonWithRole } from "@/app/types"

// Defines type of entities that might be loaded into this component
// Says "if the key is 'person', the object type is PersonWithRole"
// Erased when code compiles
export type RawMap = {
    person: Person
    org: Organization
    branch: Branch
}

// List of valid keys for this react component
export type LoadedMap = {
    person: PersonWithRole
    org: Organization
    branch: Branch
}

export type EntityType = keyof RawMap