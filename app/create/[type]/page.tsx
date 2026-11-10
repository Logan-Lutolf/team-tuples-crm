import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/prisma/db'
import { AddSchoolForm } from '@/app/schools/add-school-form'
import { AddContactForm } from '@/app/contacts/forms/add-contact'
import { BranchFormPage } from '@/app/branches/branch-form-page'
import { ProgramPageContent } from '@/app/programs/program-page-content'
import { MunicipalityPageContent } from '@/app/municipalities/municipality-page-content'
import { isRecordType } from '@/lib/record-links'

export default async function CreatePage({ params }: { params: Promise<{ type: string }> }) {
    const { type } = await params
    if (!isRecordType(type) || type === 'employees') notFound()
    let content
    if (type === 'schools') {
        const branches = await db.orm.public.Branch.select('id', 'name').all().toArray()
        content = <><h1 className="text-2xl font-semibold">Add a School</h1><AddSchoolForm branches={branches} /></>
    } else if (type === 'contacts') {
        const [branches, schools] = await Promise.all([db.orm.public.Branch.select('id', 'name').all().toArray(), db.orm.public.School.select('id', 'name').all().toArray()])
        content = <><h1 className="text-2xl font-semibold">Add a Contact</h1><AddContactForm branches={branches} schools={schools} /></>
    } else if (type === 'branches') {
        const employees = await db.orm.public.Employee.select('id', 'name', 'email').all().toArray()
        content = <BranchFormPage employees={employees} names={[...db.enums.public.Branches.values]} regions={[...db.enums.public.Region.values]} />
    } else if (type === 'programs') content = <ProgramPageContent />
    else content = <MunicipalityPageContent />
    return <div className="m-4 grid min-w-0 gap-6 sm:m-10"><Link className="w-fit underline" href={`/${type}`}>Back to {type}</Link>{content}</div>
}
