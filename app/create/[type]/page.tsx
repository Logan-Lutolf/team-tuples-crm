import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/prisma/db'
import { AddContactForm } from '@/app/contacts/forms/add-contact'
import { MunicipalityPageContent } from '@/app/municipalities/municipality-page-content'
import { isRecordType } from '@/lib/record-links'
import { AddOrganizationForm } from '@/app/schools/add-organization-form'
import { ProgramDetailsPage } from '@/app/details/pages/program-details-page'

export default async function CreatePage({ params }: { params: Promise<{ type: string }> }) {
    const { type } = await params
    if (!isRecordType(type) || type === 'employees' || type === 'branches') notFound()
    let content
    if (type === 'schools') {
        const branches = await db.orm.public.Branch.select('name').all().toArray()
        content = <><h1 className="text-2xl font-semibold">Add an Organization</h1><AddOrganizationForm branches={branches} /></>
    } else if (type === 'contacts') {
        const [branches, schools] = await Promise.all([db.orm.public.Branch.select('name').all().toArray(), db.orm.public.Organization.select('id', 'name').all().toArray()])
        content = <><h1 className="text-2xl font-semibold">Add a Contact</h1><AddContactForm branches={branches} schools={schools} /></>
    } else if (type === 'programs') content = <ProgramDetailsPage/>
    else content = <MunicipalityPageContent />
    return <div className="m-4 grid min-w-0 gap-6 sm:m-10"><Link className="w-fit underline" href={`/${type}`}>Back to {type}</Link>{content}</div>
}
