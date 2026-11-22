export const recordTypes = ['schools', 'contacts', 'employees', 'programs', 'branches', 'municipalities', 'participations'] as const
export type RecordType = typeof recordTypes[number]
export function isRecordType(value: string): value is RecordType {
    return recordTypes.some(type => type === value)
}
export function recordHref(type: RecordType, id: number) {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid record ID')
    return `/details/${type}/${id}`
}

export type DeletableType = Exclude<RecordType, 'employees' | 'participations' | 'branches'>
export function isDeletableType(value: string): value is DeletableType {
    return isRecordType(value) && value !== 'employees' && value !== 'participations'
}