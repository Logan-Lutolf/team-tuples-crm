export type HistoryDateField = 'startDate' | 'endDate'
export type HistoryDateOrder = 'newest' | 'oldest'

type HistoryRecord = { id: number; startDate: string; endDate: string | null }

export function sortHistoryByDate<T extends HistoryRecord>(records: readonly T[], field: HistoryDateField, order: HistoryDateOrder): T[] {
    return [...records].sort((a, b) => {
        const left = a[field], right = b[field]
        // Open-ended periods stay last in either direction.
        if (left === null) return right === null ? b.id - a.id : 1
        if (right === null) return -1
        const difference = Date.parse(left) - Date.parse(right) || a.id - b.id
        return order === 'oldest' ? difference : -difference
    })
}
