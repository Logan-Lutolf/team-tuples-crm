import type { Branch, Organization, Participation, Person, PersonWithRole } from "@/app/types"

// Defines type of entities that might be loaded into this component
// Says "if the key is 'person', the object type is PersonWithRole"
// Erased when code compiles
export type RawMap = {
    person: Person
    org: Organization
    branch: Branch
    participation: Participation
}

// List of valid keys for this react component
export type LoadedMap = {
    person: PersonWithRole
    org: Organization
    branch: Branch
    participation: Participation
}

export type EntityType = keyof RawMap