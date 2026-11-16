import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { db } from '@/prisma/db'
import { currentEmployee } from '@/lib/current-employee'
import { canViewEditHistory, type HistoryType } from '@/lib/edit-history-policy'

export async function getEditHistory(type: HistoryType, id: number, before?: number) {
    const employee = await currentEmployee()
    if (!employee) redirect('/login')
    if (!canViewEditHistory(employee.roles)) notFound()
    let query = db.orm.public.EditHistory.where({ recordType: type, recordId: id })
    if (before !== undefined) query = query.where(entry => entry.id.lt(before))
    const entries = await query.orderBy(entry => entry.id.desc()).limit(51).all().toArray()
    return { entries: entries.slice(0, 50), hasMore: entries.length > 50 }
}
