import { SchoolDetailsPage } from '@/app/schools/school-details-page'
import { loadSchoolDetails } from '@/app/schools/load-school-details'
import { ContactDetailsPage } from '@/app/contacts/contact-details-page'
import { loadContactDetails } from '@/app/contacts/load-contact-details'
import { BranchEditAccess } from '@/components/records/branch-edit-access'
import { branchEditScope } from '@/lib/branch-edit-access'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMunicipalityDetails, getParticipationDetails } from '@/app/municipalities/actions'
import { timeDetails } from '@/lib/detail-timing'
import { isRecordType } from '@/lib/record-links'
import { MunicipalityPageContent } from '@/app/municipalities/municipality-page-content'
import { EmployeeDetails } from '@/app/employee-management/employee-details'
import { currentEmployee } from '@/lib/current-employee'
import { canViewEditHistory } from '@/lib/edit-history-policy'
import { EditHistoryAccess } from '@/components/records/edit-history-button'
import { ParticipationPageContent } from '@/app/program-instances/instance-page-content'
import { ProgramDetailsPage } from '../../pages/program-details-page'
import { BranchDetailsPage } from '../../pages/branch-details-page'




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
    const employee = await currentEmployee()
    const editScope = await branchEditScope(employee)
    let content
        if (type === 'schools') {
            const details = await loadRecord('schools', () => loadSchoolDetails(id, false, true))
            content = <SchoolDetailsPage schoolId={id} schoolName={details.name} initialDetails={details} />
        } else if (type === 'contacts') {
            const details = await loadRecord('contacts', () => loadContactDetails(id, false, true))
            content = <ContactDetailsPage contactId={id} contactName={details.contact.name} initialDetails={details} />
        }
        
        else if (type === 'branches') {

            content = <BranchDetailsPage />
        } else if (type === 'programs') {
            
            content = <ProgramDetailsPage />
        } else if (type === 'municipalities') {
            const details = await loadRecord('municipalities', () => getMunicipalityDetails(id))
            content = <MunicipalityPageContent key={id} municipality={details.municipality} mode="view" initialDetails={details} />
        } else if (type === 'participations') {
            const details = await loadRecord('participations', () => getParticipationDetails(id))
            content = <ParticipationPageContent key={id} municipality={details?.participationData} mode="view" initialDetails={details} />
        } 
        else {
            content = <EmployeeDetails employeeId={id} />
        }
    var list = type === 'employees' ? '/employee-management' : `/${type}`
    if (type === 'participations') list = '/program-instances'
    return <BranchEditAccess scope={editScope}><EditHistoryAccess allowed={canViewEditHistory(employee?.roles ?? [])}><div className="m-10 grid gap-6"><Link href={list} className="w-fit underline">Back to {type}</Link><div>{content}</div></div></EditHistoryAccess></BranchEditAccess>
}
