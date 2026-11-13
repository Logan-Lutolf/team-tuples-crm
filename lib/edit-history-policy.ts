export const historyTypes = ['schools', 'contacts', 'branches', 'programs', 'municipalities'] as const
export type HistoryType = typeof historyTypes[number]

export function isHistoryType(value: string): value is HistoryType {
    return historyTypes.some(type => type === value)
}

export function canViewEditHistory(roles: readonly string[]) {
    return roles.some(role => /ADMIN|COORDINATOR/i.test(role))
}

type Snapshot = Record<string, unknown> | null

function flatten(value: Snapshot, prefix = ''): Record<string, unknown> {
    return Object.fromEntries(Object.entries(value ?? {}).flatMap(([key, item]) => {
        const path = prefix ? `${prefix}.${key}` : key
        if (item && typeof item === 'object' && !Array.isArray(item)) {
            return Object.entries(flatten(item as Snapshot, path))
        }
        return [[path, item]]
    }))
}

export function changedFields(before: Snapshot, after: Snapshot) {
    const previous = flatten(before), next = flatten(after)
    return [...new Set([...Object.keys(previous), ...Object.keys(next)])]
        .filter(field => !['id', 'createdAt', 'updatedAt'].includes(field))
        .filter(field => JSON.stringify(previous[field] ?? null) !== JSON.stringify(next[field] ?? null))
        .map(field => ({ field, before: previous[field] ?? null, after: next[field] ?? null }))
}
