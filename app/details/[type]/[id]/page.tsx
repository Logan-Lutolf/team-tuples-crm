import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSchoolDetails } from '@/app/schools/actions_schools'
import { getContactDetails } from '@/app/contacts/actions_contacts'
import { getBranchDetails } from '@/app/branches/actions'
import { getProgramDetails } from '@/app/programs/actions'
import { getMunicipalityDetails, getParticipationDetails } from '@/app/municipalities/actions'
import { timeDetails } from '@/lib/detail-timing'
import { isRecordType } from '@/lib/record-links'
import { SchoolDetailsPage } from '@/app/schools/school-details-page'
import { ContactDetailsPage } from '@/app/contacts/contact-details-page'
import { BranchDetailsPage } from '@/app/branches/branch-details-page'
import { ProgramPageContent } from '@/app/programs/program-page-content'
import { MunicipalityPageContent } from '@/app/municipalities/municipality-page-content'
import { EmployeeDetails } from '@/app/employee-management/employee-details'
import { ParticipationPageContent } from '@/app/program-instances/instance-page-content'

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
            const details = await loadRecord('schools', () => getSchoolDetails(id, false, true))
            content = <SchoolDetailsPage key={id} schoolId={id} schoolName={details.name} initialDetails={details} />
        } else if (type === 'contacts') {
            const details = await loadRecord('contacts', () => getContactDetails(id, false, true))
            content = <ContactDetailsPage key={id} contactId={id} contactName={details.contact.name} initialDetails={details} />
        } else if (type === 'branches') {
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
        } else content = <EmployeeDetails employeeId={id} />
    var list = type === 'employees' ? '/employee-management' : `/${type}`
    list = type === 'participations' ? '/program-instances' : `/${type}`
    return <div className="m-10 grid gap-6"><Link href={list} className="w-fit underline">Back to {type}</Link><div>{content}</div></div>
}
