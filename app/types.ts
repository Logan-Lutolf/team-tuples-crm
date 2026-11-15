import { Models } from "@/prisma/contract";
import { Scalars } from "@prisma/orm-postgres/components";





export type Participation = Scalars<Models.public_Participation>

export type Organization = Scalars<Models.public_Organization>

export type Employee = Scalars<Models.public_Employee>

export type Person = Scalars<Models.public_Person>

export type RoleTypes = Scalars<Models.public_Employee>["role"]

export type BranchTypes = Scalars<Models.public_Employee>["branch"]

export type PersonRoles = Scalars<Models.public_PersonRoles>

export type EmployeePerson = {
    person: Person,
    employee: Employee
}

export type ParticipationPerson = {
    person: Person,
    participation: Participation
}


export type PersonWithRole = Person & { personRole: PersonRoles | null }

export type OrganizationPerson = {
    person: PersonWithRole,
    organization: Organization
    roles: PersonWithRole["personRole"]
}