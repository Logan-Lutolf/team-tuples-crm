import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { decrypt } from '@/app/login/sessions'
import { db } from '@/prisma/db'

// Read current roles from Postgres; a previously issued cookie must not preserve revoked access.
export const currentEmployee = cache(async () => {
    const session = (await cookies()).get('session')?.value
    if (!session) return null
    const payload = await decrypt(session)
    if (!payload || !Number.isSafeInteger(payload.userId) || payload.userId <= 0) return null
    const [employee, person] = await Promise.all([
        db.orm.public.Employee.where({ personId: payload.userId }).select('personId', 'role').first(),
        db.orm.public.Person.where({ id: payload.userId }).select('id', 'name', 'email').first(),
    ])
    if (!employee || !person) return null
    // Global page access uses Employee.role. A scoped assignment must not grant global access.
    return { id: employee.personId, name: person.name, email: person.email ?? '', roles: employee.role }
})
