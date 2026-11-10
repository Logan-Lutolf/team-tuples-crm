'use client'
import { useId } from 'react'

import type { HistoryDateField, HistoryDateOrder } from '@/lib/history-date-sort'
export type { HistoryDateField, HistoryDateOrder } from '@/lib/history-date-sort'

export function HistoryDateSort({ field, onFieldChange, value, onChange }: { field: HistoryDateField; onFieldChange: (field: HistoryDateField) => void; value: HistoryDateOrder; onChange: (value: HistoryDateOrder) => void }) {
    const id = useId()
    return <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={`${id}-field`}>Sort by</label>
        <select id={`${id}-field`} value={field} onChange={event => onFieldChange(event.target.value as HistoryDateField)} className="rounded-md border border-input bg-transparent p-2">
            <option value="startDate">Start date</option>
            <option value="endDate">End date</option>
        </select>
        <label htmlFor={id}>Order</label>
        <select id={id} value={value} onChange={event => onChange(event.target.value as HistoryDateOrder)} className="rounded-md border border-input bg-transparent p-2">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
        </select>
    </div>
}
