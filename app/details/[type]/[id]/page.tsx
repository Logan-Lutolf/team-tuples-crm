import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/prisma/db'
import { isRecordType } from '@/lib/record-links'
import { SchoolDetailsPage } from '@/app/schools/school-details-page'
import { ContactDetailsPage } from '@/app/contacts/contact-details-page'
import { BranchDetailsPage } from '@/app/branches/branch-details-page'
import { ProgramPageContent } from '@/app/programs/program-page-content'
import { MunicipalityPageContent } from '@/app/municipalities/municipality-page-content'
import { EmployeeDetails } from '@/app/employee-management/employee-details'

export default async function RecordPage({ params }: { params: Promise<{ type: string; id: string }> }) {
    const { type, id: rawId } = await params
    const id = Number(rawId)
    if (!isRecordType(type) || !/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id <= 0) notFound()
    let content
    if (type === 'schools') {
        const record = await db.orm.public.School.where({ id }).select('id', 'name').first()
        if (!record) notFound()
        content = <SchoolDetailsPage key={id} schoolId={id} schoolName={record.name} />
    } else if (type === 'contacts') {
        const record = await db.orm.public.Contact.where({ id }).select('id', 'name').first()
        if (!record) notFound()
        content = <ContactDetailsPage key={id} contactId={id} contactName={record.name} />
    } else if (type === 'branches') {
        const record = await db.orm.public.Branch.where({ id }).select('id', 'name').first()
        if (!record) notFound()
        content = <BranchDetailsPage key={id} branchId={id} branchName={record.name} />
    } else if (type === 'programs') {
        const record = await db.orm.public.Program.where({ id }).first()
        if (!record) notFound()
        content = <ProgramPageContent key={id} program={record} mode="view" />
    } else if (type === 'municipalities') {
        const record = await db.orm.public.Municipality.where({ id }).first()
        if (!record) notFound()
        content = <MunicipalityPageContent key={id} municipality={record} mode="view" />
    } else content = <EmployeeDetails employeeId={id} />
    const list = type === 'employees' ? '/employee-management' : `/${type}`
    return <div className="m-10 grid gap-6"><Link href={list} className="w-fit underline">Back to {type}</Link><div>{content}</div></div>
}
