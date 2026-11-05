export type ParticipationStatus = 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
type DatedParticipation = { id: number; startDate: string; endDate: string | null; status: ParticipationStatus }

export function participationStatus(participation: Omit<DatedParticipation, 'id'>, now: number): ParticipationStatus {
    if (participation.status === 'CANCELLED') return 'CANCELLED'
    if (now < Date.parse(participation.startDate)) return 'PLANNED'
    if (participation.endDate && now >= Date.parse(participation.endDate)) return 'COMPLETED'
    return 'ONGOING'
}

export function datedParticipations<T extends DatedParticipation>(participations: readonly T[], now: number): T[] {
    return participations.map(p => ({ ...p, status: participationStatus(p, now) }))
        .sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate) || b.id - a.id)
}
