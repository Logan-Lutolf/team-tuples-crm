import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getContactDetails } from '@/app/contacts/actions_contacts'
import { getBranchDetails } from '@/app/branches/actions'
import { getProgramDetails } from '@/app/programs/actions'
import { getMunicipalityDetails, getParticipationDetails } from '@/app/municipalities/actions'
import { timeDetails } from '@/lib/detail-timing'
import { isRecordType } from '@/lib/record-links'
import { BranchDetailsPage } from '@/app/branches/branch-details-page'
import { ProgramPageContent } from '@/app/programs/program-page-content'
import { MunicipalityPageContent } from '@/app/municipalities/municipality-page-content'
import { EmployeeDetails } from '@/app/employee-management/employee-details'
import { ParticipationPageContent } from '@/app/program-instances/instance-page-content'
import { OrganizationDetailsPage } from '@/app/details/pages/organization-details-page'
import { db } from '@/prisma/db'
import { PersonDetailsPage } from '../../pages/person-details-page'
import { EmployeeDetailsPage } from '../../pages/employee-details-page'




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
            const org = await db.orm.public.Organization
                .where({id: id})
                .first()

            const contacts = await db.orm.public.Person
                .where({orgId: id})
                .include("personRole")
                .all()
            
            const participations = await db.orm.public.Participation
                .where({organizationId: id})
                .all()

            if (org == null || contacts == null || participations == null) return
            content = <OrganizationDetailsPage organization={org} participations={participations} contacts={contacts}/>
        } 
        
        else if (type === 'contacts') {
            const person = await db.orm.public.Person.include("employee").where({id: id}).first()
            
            const participationRows = await db.orm.public.ParticipationEmployees
                .where({ employeeId: id })
                .include("participation")
                .all()
            const participations = participationRows.map((row) => row.participation)

            if (person == null || participations == null) return

            content = <PersonDetailsPage key={id} person={person} participations={participations} />
        } 
        
        else if (type === 'branches') {
            const details = await loadRecord('branches', () => getBranchDetails(id))
            content = <BranchDetailsPage key={id} branchId={id} branchName={details.branch.name} initialDetails={details} />
        } else if (type === 'programs') {
            const details = await loadRecord('programs', () => getProgramDetails(id, false, true))
            content = <ProgramPageContent key={id} program={details.program} mode="view" initialDetails={details} />
        } else if (type === 'municipalities') {
            const details = await loadRecord('municipalities', () => getMunicipalityDetails(id))
            content = <MunicipalityPageContent key={id} municipality={details.municipality} mode="view" initialDetails={details} />
        } else if (type === 'participations') {
            const details = await loadRecord('participations', () => getParticipationDetails(id))
            content = <ParticipationPageContent key={id} municipality={details?.participationData} mode="view" initialDetails={details} />
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

            if (person == null || assignments == null || participations == null || employee == null) return
            
            content = <EmployeeDetailsPage person={person} employee={employee} assignments={assignments} participations={participations} />
        
        }
    var list = type === 'employees' ? '/employee-management' : `/${type}`
    list = type === 'participations' ? '/program-instances' : `/${type}`
    return <div className="m-10 grid gap-6"><Link href={list} className="w-fit underline">Back to {type}</Link><div>{content}</div></div>
}
