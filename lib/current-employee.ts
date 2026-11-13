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
    const employee = await db.orm.public.Employee.where({ id: payload.userId }).select('id', 'name', 'roles').first()
    if (!employee) return null
    const assignments = await db.orm.public.EmployeeAssignment.where({ employeeId: employee.id }).select('role').all().toArray()
    return { ...employee, roles: [...new Set([...employee.roles, ...assignments.map(a => a.role)])] }
})
