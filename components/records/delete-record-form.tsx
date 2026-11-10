'use client'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageActionLink } from './page-action-link'
import { deleteSchool } from '@/app/schools/actions_schools'
import { deleteContact } from '@/app/contacts/actions_contacts'
import { deleteBranch } from '@/app/branches/actions'
import { deleteProgram } from '@/app/programs/actions'
import { deleteMunicipality } from '@/app/municipalities/actions'
import type { RecordType } from '@/lib/record-links'

function Submit() { const { pending } = useFormStatus(); return <Button variant="destructive" type="submit" disabled={pending}>{pending ? 'Deleting…' : 'Delete record'}</Button> }
export function DeleteRecordForm({ type, id, name }: { type: Exclude<RecordType, 'employees'>; id: number; name: string }) {
    const router = useRouter()
    const prefix = useId()
    const [error, setError] = useState('')
    return <form className="grid max-w-2xl gap-4 rounded-lg border p-6" action={async form => {
        setError('')
        if (form.get('confirmation') !== 'delete') { setError('Type delete to confirm.'); return }
        const data = new FormData()
        data.set(type === 'schools' || type === 'contacts' ? 'school-id' : 'id', String(id))
        data.set('confirmation', 'delete')
        data.set('confirm-delete', 'delete')
        try {
            const action = { schools: deleteSchool, contacts: deleteContact, branches: deleteBranch, programs: deleteProgram, municipalities: deleteMunicipality }[type]
            const result = await action(data)
            if ('error' in result) setError(result.error)
            else { router.replace(`/${type}`); router.refresh() }
        } catch { setError('Could not delete this record. Check your connection and try again.') }
    }}>
        <h1 className="text-2xl font-semibold">Delete {name}</h1>
        <p>Related schools, contacts, employees, programs, branches, and municipalities are kept. Their links to this record are cleared automatically. Assignment and join records belonging to this record are removed. This action cannot be undone.</p>
        <label htmlFor={prefix}>Type delete to confirm<Input id={prefix} name="confirmation" pattern="delete" required autoComplete="off" /></label>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <div className="flex gap-3"><PageActionLink href={`/details/${type}/${id}`}>Cancel</PageActionLink><Submit /></div>
    </form>
}
