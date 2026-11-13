// These helpers are shared by the page and snapshot actions so they filter identically.
export type EmailContact = {
    id: number; name: string; email: string; role: string
    schoolId: number | null; school: string
    branchId: number | null; branch: string; region: string | null
    lastTrackedEmailAt: string | null
    smartEmailingLastDeliveredAt?: string | null
}
export type ContactFilters = {
    name: string; email: string; role: string; school: string; branch: string; region: string
    lastEmail: 'any' | 'never' | 'contacted'; since: string; until: string
}
export const emptyContactFilters: ContactFilters = {
    name: '', email: '', role: '', school: '', branch: '', region: '', lastEmail: 'any', since: '', until: '',
}
export type SegmentSummary = { id: number; name: string; contactCount: number; createdAt: string }
export type SavedSegment = SegmentSummary & { contacts: EmailContact[]; filters: ContactFilters }

export function canUseEmailContacts(roles: readonly string[]) {
    return roles.some(role => role === 'ADMIN' || role === 'MARKETER' || role.includes('COORDINATOR'))
}

export function validEmail(value: string) {
    const email = value.trim(), local = email.split('@')[0]
    return email.length <= 254 && local.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') &&
        /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email)
}

export function validateContactFilters(raw: unknown): ContactFilters {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid contact filters.')
    const result = { ...emptyContactFilters }
    for (const key of Object.keys(result) as (keyof ContactFilters)[]) {
        const value = (raw as Record<string, unknown>)[key] ?? result[key]
        if (typeof value !== 'string' || value.length > 200) throw new Error('Invalid contact filters.')
        Object.assign(result, { [key]: value.trim() })
    }
    if (!['any', 'never', 'contacted'].includes(result.lastEmail)) throw new Error('Choose a valid last-email filter.')
    for (const date of [result.since, result.until]) {
        if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) {
            throw new Error('Choose valid filter dates.')
        }
    }
    if (result.since && result.until && result.since > result.until) throw new Error('The start date must be on or before the end date.')
    return result
}

// Calendar filters and displayed times use Post Bellum's local timezone.
export function emailDate(value: string) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value))
    const part = (type: string) => parts.find(part => part.type === type)!.value
    return `${part('year')}-${part('month')}-${part('day')}`
}

// Old saved snapshots have no newsletter date; their original CC date remains valid.
export function lastEmailAt(contact: EmailContact) {
    const dates = [contact.lastTrackedEmailAt, contact.smartEmailingLastDeliveredAt].filter((value): value is string => Boolean(value))
    return dates.sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null
}

export function filterEmailContacts(contacts: readonly EmailContact[], filters: ContactFilters) {
    return contacts.filter(contact => {
        if (!contact.name.toLowerCase().includes(filters.name.trim().toLowerCase()) || !contact.email.toLowerCase().includes(filters.email.trim().toLowerCase())) return false
        if (filters.role && contact.role !== filters.role) return false
        if (filters.region && contact.region !== filters.region) return false
        if (filters.school && (filters.school === 'none' ? contact.schoolId !== null : String(contact.schoolId) !== filters.school)) return false
        if (filters.branch && (filters.branch === 'none' ? contact.branchId !== null : String(contact.branchId) !== filters.branch)) return false
        const lastEmail = lastEmailAt(contact)
        if (filters.lastEmail === 'never') return lastEmail === null
        if (filters.lastEmail === 'contacted' && !lastEmail) return false
        if (filters.since || filters.until) {
            if (!lastEmail) return false
            const date = emailDate(lastEmail)
            if (filters.since && date < filters.since) return false
            if (filters.until && date > filters.until) return false
        }
        return true
    })
}

export function contactEmails(contacts: readonly Pick<EmailContact, 'email'>[]) {
    const unique = new Map<string, string>()
    for (const { email } of contacts) {
        const trimmed = email.trim()
        if (validEmail(trimmed) && !unique.has(trimmed.toLowerCase())) unique.set(trimmed.toLowerCase(), trimmed)
    }
    return [...unique.values()]
}
