export type SmartEmailFiltersData = {
    lists: { id: number; name: string; status: 'confirmed' | 'unsubscribed' }[]
    blacklisted: boolean; hardBounced: boolean; softBounces: number
}
export type SmartCampaignActivity = { name: string; deliveredAt: string | null; openDates: string[]; clickDates: string[] }

// These helpers are shared by the page and snapshot actions so they filter identically.
export type EmailContact = {
    id: number; name: string; email: string; role: string
    schoolId: number | null; school: string
    branchId: string | null; branch: string; region: string | null
    lastTrackedEmailAt: string | null
    smartEmailingLastDeliveredAt?: string | null
    smartEmailing?: SmartEmailFiltersData | null
    smartCampaigns?: SmartCampaignActivity[]
}
export type ContactFilters = {
    name: string; email: string; role: string; school: string; branch: string; region: string
    lastEmail: 'any' | 'never' | 'contacted'; since: string; until: string
    mailingList: string; subscription: 'any' | 'subscribed' | 'unsubscribed' | 'blacklisted' | 'unknown'
    bounce: 'any' | 'hard' | 'soft' | 'none' | 'unknown'; campaign: string
    engagement: 'any' | 'opened' | 'clicked' | 'unopened' | 'unclicked'; engagementSince: string; engagementUntil: string
}
export const emptyContactFilters: ContactFilters = {
    name: '', email: '', role: '', school: '', branch: '', region: '', lastEmail: 'any', since: '', until: '',
    mailingList: '', subscription: 'any', bounce: 'any', campaign: '', engagement: 'any', engagementSince: '', engagementUntil: '',
}
export type SegmentSummary = { id: number; name: string; contactCount: number; createdAt: string }
export type SavedSegment = SegmentSummary & { contacts: EmailContact[]; filters: ContactFilters }

export function canUseEmailContacts(roles: readonly string[]) {
    return roles.some(role => role === 'ADMIN' || role === 'COORDINATOR' || role.endsWith('_COORDINATOR'))
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
    if (!['any', 'subscribed', 'unsubscribed', 'blacklisted', 'unknown'].includes(result.subscription) ||
        !['any', 'hard', 'soft', 'none', 'unknown'].includes(result.bounce) ||
        !['any', 'opened', 'clicked', 'unopened', 'unclicked'].includes(result.engagement)) throw new Error('Choose valid SmartEmailing filters.')
    if (result.mailingList && !/^[1-9]\d*$/.test(result.mailingList)) throw new Error('Choose a valid mailing list.')
    for (const date of [result.since, result.until, result.engagementSince, result.engagementUntil]) {
        if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) {
            throw new Error('Choose valid filter dates.')
        }
    }
    if (result.since && result.until && result.since > result.until) throw new Error('The start date must be on or before the end date.')
    if (result.engagementSince && result.engagementUntil && result.engagementSince > result.engagementUntil) throw new Error('The engagement start date must be on or before the end date.')
    if (result.engagement === 'any' && (result.engagementSince || result.engagementUntil)) throw new Error('Choose an open or click filter for the engagement dates.')
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
        if (filters.lastEmail === 'never' && lastEmail !== null) return false
        if (filters.lastEmail === 'contacted' && !lastEmail) return false
        if (filters.since || filters.until) {
            if (!lastEmail) return false
            const date = emailDate(lastEmail)
            if (filters.since && date < filters.since) return false
            if (filters.until && date > filters.until) return false
        }
        const profile = contact.smartEmailing
        const memberships = (profile?.lists ?? []).filter(list => !filters.mailingList || String(list.id) === filters.mailingList)
        if (filters.mailingList && !memberships.length) return false
        if (filters.subscription === 'unknown' && profile) return false
        if (filters.subscription === 'blacklisted' && !profile?.blacklisted) return false
        if (filters.subscription === 'subscribed' && (!profile || profile.blacklisted || !memberships.some(list => list.status === 'confirmed'))) return false
        if (filters.subscription === 'unsubscribed' && !memberships.some(list => list.status === 'unsubscribed')) return false
        if (filters.bounce === 'unknown' && profile) return false
        if (filters.bounce === 'hard' && !profile?.hardBounced) return false
        if (filters.bounce === 'soft' && (!profile || profile.hardBounced || profile.softBounces === 0)) return false
        if (filters.bounce === 'none' && (!profile || profile.hardBounced || profile.softBounces > 0)) return false
        // Campaign and engagement must match the same campaign, not unrelated newsletters.
        const campaigns = (contact.smartCampaigns ?? []).filter(campaign => campaign.name.toLowerCase().includes(filters.campaign.trim().toLowerCase()))
        if (filters.campaign && !campaigns.length) return false
        if (filters.engagement !== 'any') {
            if (!campaigns.length) return false
            const dateField = ['opened', 'unopened'].includes(filters.engagement) ? 'openDates' : 'clickDates'
            const hasEvent = campaigns.some(campaign => campaign[dateField].some(date =>
                (!filters.engagementSince || date >= filters.engagementSince) && (!filters.engagementUntil || date <= filters.engagementUntil)))
            const wantsEvent = ['opened', 'clicked'].includes(filters.engagement)
            if (hasEvent !== wantsEvent) return false
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
