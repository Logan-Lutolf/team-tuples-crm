import { notFound } from 'next/navigation'
import { db } from '@/prisma/db'
import { isDeletableType, isRecordType } from '@/lib/record-links'
import { DeleteRecordForm } from '@/components/records/delete-record-form'



export default async function DeletePage({ params }: { params: Promise<{ type: string; id: string }> }) {
    const { type, id: rawId } = await params
    const id = Number(rawId)
    if (!isDeletableType(type) || !/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id <= 0) notFound()
    const record = type === 'schools' ? await db.orm.public.Organization.where({ id }).select('name').first()
        : type === 'contacts' ? await db.orm.public.Person.where({ id }).select('name').first()
        : type === 'branches' ? await db.orm.public.Branch.where({ id }).select('name').first()
        : type === 'programs' ? await db.orm.public.Program.where({ id }).select('name').first()
        : await db.orm.public.Municipality.where({ id }).select('name').first()
    if (!record) notFound()
    return <div className="m-4 sm:m-10"><DeleteRecordForm type={type} id={id} name={record.name} /></div>
}
