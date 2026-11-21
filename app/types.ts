import { Models } from "@/prisma/contract";
import { Scalars } from "@prisma/orm-postgres/components";





export type Participation = Scalars<Models.public_Participation>

export type Organization = Scalars<Models.public_Organization>



export type Employee = Scalars<Models.public_Employee>

export type Person = Scalars<Models.public_Person>

export type RoleTypes = Scalars<Models.public_Employee>["role"]

export type PersonRoles = Scalars<Models.public_PersonRoles>
export type ContactTypes = Scalars<Models.public_PersonRoles>["type"]

export type EmployeeAssignment = Scalars<Models.public_EmployeeAssignment>

export const RELATIONSHIP_TYPES = [
    "POOR",
    "AVERAGE",
    "EXCELLENT"
] as const


export const ORG_TYPES = [
    "PRIMARY_SCHOOL",
    "SECONDARY_SCHOOL",
    "THEATRE",
    "CULTURAL"
] as const
export type OrganizationTypes = (typeof ORG_TYPES)[number]


export const BRANCH_TYPES = [
    "SEVERNÍ_ČECHY",
    "VÝCHODNÍ_ČECHY",
    "STŘEDNÍ_MORAVA",
    "PLZEŇSKÝ_KRAJ",
    "JIŽNÍ_MORAVA",
    "JIŽNÍ_ČECHY",
    "KARLOVARSKÝ_KRAJ",
    "MORAVSKOSLEZSKÝ_KRAJ",
    "PRAHA",
] as const
export type BranchTypes = (typeof BRANCH_TYPES)[number]

export type Branch = Scalars<Models.public_Branch>

export type EmployeePerson = {
    person: Person,
    employee: Employee
}

export type ParticipationPerson = {
    person: Person,
    participation: Participation
}

export type PersonWithRole = Person & {
    personRole: Scalars<Models.public_PersonRoles>["type"] | null;
};

export type OrganizationPerson = {
    person: PersonWithRole,
    organization: Organization
    roles: PersonWithRole["personRole"]
}

export type EmployeeAssignmentPerson = {
    person: Person,
    assignment: EmployeeAssignment
}

export const REGION_TYPES = [
    "PRAHA",
    "STŘEDOČESKÝ",
    "JIHOČESKÝ",
    "PLZEŇSKÝ",
    "KARLOVARSKÝ",
    "ÚSTECKÝ",
    "LIBERECKÝ",
    "KRÁLOVÉHRADECKÝ",
    "PARDUBICKÝ",
    "JIHOMORAVSKÝ",
    "OLOMOUCKÝ",
    "ZLÍNSKÝ",
    "MORAVSKOSLEZSKÝ",
    "JIHLAVA",
] as const

export type RegionTypes = (typeof REGION_TYPES)[number]

export type ActionResult = { result: "success" | "error"; message: string }


export const CONTACT_TYPES = [ // Redundancy here; edit later
  "TEACHER",
  "PRINCIPAL",
  "SCHOOL_COORDINATOR",
  "STUDENT",
  "HISTORIAN",
  "GOVERNMENT_OFFICIAL",
  "DONOR",
  "SPONSOR",
  "PARTNER",
  "VOLUNTEER",
  "OTHER",
] as const