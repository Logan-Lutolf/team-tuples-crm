import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMunicipalityDetails, getParticipationDetails } from '@/app/municipalities/actions'
import { timeDetails } from '@/lib/detail-timing'
import { isRecordType } from '@/lib/record-links'
import { MunicipalityPageContent } from '@/app/municipalities/municipality-page-content'
import { OrganizationDetailsPage } from '@/app/details/pages/organization-details-page'
import { db } from '@/prisma/db'
import { PersonDetailsPage } from '../../pages/person-details-page'
import { EmployeeDetailsPage } from '../../pages/employee-details-page'
import { ProgramDetailsPage } from '../../pages/program-details-page'
import { BranchDetailsPage } from '../../pages/branch-details-page'
import { ParticipationDetailsPage } from '../../pages/participation-details-page'
import { OrganizationPerson, Person, PersonWithRole } from '@/app/types'




async function loadRecord<T>(label: string, load: () => Promise<T>) {
    try { return await timeDetails(label, load) }
    catch (error) {
        if (error instanceof Error && [
            'School not found.', 'Contact not found.', 'This branch no longer exists.',
            'Program not found.', 'Municipality not found',
        ].includes(error.message)) notFound()
        throw error
    }
}


export default async function RecordPage({ params }: { params: Promise<{ type: string; id: string }> }) {
    var { type, id: rawId } = await params
    const id = Number(rawId)

    if (!isRecordType(type) || !/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id <= 0) notFound()
    let content
        if (type === 'schools') {
            const org = await db.orm.public.Organization.where({ id }).first()
            if (!org) notFound()

            const people = await db.orm.public.Person
                .include("personRole")
                .where({ orgId: id })
                .all()
                .toArray()

            const participations = await db.orm.public.Participation
                .where({ organizationId: id })
                .all()
                .toArray()

            const contacts: PersonWithRole[] = people.map((p) => ({
                ...p,
                personRole: p.personRole?.type ?? null,
            }))


            if (org == null || people == null || participations == null) return
            content = <OrganizationDetailsPage organization={org} participations={participations} contacts={contacts}/>
        } 
        
        else if (type === 'contacts') {
            const person = await db.orm.public.Person.include("employee").where({ id }).first()

            // employees belong under /employees, not /contacts
            if (!person || person.employee) notFound()   // from "next/navigation"

            const participationRows = await db.orm.public.ParticipationContacts
                .where({ personId: id })
                .include("participation")
                .all()
                .toArray()

            const participations = participationRows.map((row) => row.participation)

            const interactions = await db.orm.public.Interaction
                .include("program")
                .where({ personId: id })
                .all()
                .toArray()

            // One query per distinct employee, not per interaction
            const employeeIds = [
                ...new Set(interactions.map((i) => i.employeeId).filter((x): x is number => x != null)),
            ]

            const staff = await Promise.all(
                employeeIds.map((eid) => db.orm.public.Person.where({ id: eid }).first())
            )
            const nameById = new Map(
                staff.filter((p): p is NonNullable<typeof p> => p != null).map((p) => [p.id, p.name])
            )

            const rows = interactions.map((i) => ({
                ...i,
                employeeName: i.employeeId != null ? nameById.get(i.employeeId) ?? "Unknown" : "Unknown",
                programName: i.program?.name ?? "—",
            }))


            content = <PersonDetailsPage key={id} person={person} participations={participations} interactions={rows}/>
        } 
        
        else if (type === 'branches') {

            content = <BranchDetailsPage />
        } else if (type === 'programs') {
            
            content = <ProgramDetailsPage />
        } else if (type === 'municipalities') {
            const details = await loadRecord('municipalities', () => getMunicipalityDetails(id))
            content = <MunicipalityPageContent key={id} municipality={details.municipality} mode="view" initialDetails={details} />
        } else if (type === 'participations') {
            // const details = await loadRecord('participations', () => getParticipationDetails(id))
            // content = <ParticipationPageContent key={id} municipality={details?.participationData} mode="view" initialDetails={details} />
            
            const participation = await db.orm.public.Participation.where({id: id}).first()
            const partContacts = await db.orm.public.ParticipationContacts.where({participationId: id}).all().toArray()

            const people = await Promise.all(
                partContacts.map((pc) =>
                db.orm.public.Person
                .include("personRole")
                .include("student")
                .where({ id: pc.personId })
                .first()
                )
            )

            const students = people
                .filter((p): p is NonNullable<typeof p> => p != null)
                .filter(
                    (p): p is typeof p & { student: NonNullable<typeof p.student> } =>
                    p.student != null
                )

            if (participation && students) {
                content = <ParticipationDetailsPage part={participation} contacts={students}/>
            }
        } 
        else {
            const person = await db.orm.public.Person.include("employee").where({id: id}).first()
            const employee = await db.orm.public.Employee.where({personId: id}).first()
            
            const assignments = await db.orm.public.EmployeeAssignment
                .where({ employeeId: id })
                .all()

            const participationRows = await db.orm.public.ParticipationEmployees
                .where({ employeeId: id })
                .include("participation")
                .all()
            const participations = participationRows.map((row) => row.participation)

            const interactions = await db.orm.public.Interaction
                .include("program")
                .where({ employeeId: id })
                .all()
                .toArray()

            // One query per distinct employee, not per interaction
            const contactIds = [
                ...new Set(interactions.map((i) => i.personId).filter((x): x is number => x != null)),
            ]

            const staff = await Promise.all(
                contactIds.map((cid) => db.orm.public.Person.where({ id: cid }).first())
            )
            const nameById = new Map(
                staff.filter((p): p is NonNullable<typeof p> => p != null).map((p) => [p.id, p.name])
            )

            const rows = interactions.map((i) => ({
                ...i,
                personName: i.personId != null ? nameById.get(i.personId) ?? "Unknown" : "Unknown",
                programName: i.program?.name ?? "—",
            }))




            if (person == null || assignments == null || participations == null || employee == null || rows == null) return
            
            content = <EmployeeDetailsPage person={person} employee={employee} assignments={assignments} participations={participations} interactions={rows} />
        
        }
    var list = type === 'employees' ? '/employee-management' : `/${type}`
    list = type === 'participations' ? '/program-instances' : `/${type}`
    return <div className="m-10 grid gap-6"><Link href={list} className="w-fit underline">Back to {type}</Link><div>{content}</div></div>
}
