import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { loadRecommendations } from './recommendation-data'

type SuggestedContact = { id: number; name: string; role: string }

const linkClass = 'font-medium underline-offset-4 hover:underline focus-visible:underline'
const formatRole = (role: string) => role.toLowerCase().replaceAll('_', ' ')
const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Europe/Prague' })

export async function Recommendations({ organizationView }: { organizationView: boolean }) {
    const organizationLabel = organizationView ? 'organizations' : 'schools'
    let recommendations: Awaited<ReturnType<typeof loadRecommendations>>
    try {
        recommendations = await loadRecommendations(organizationView)
    } catch {
        console.error('Could not load dashboard recommendations.')
        return (
            <section aria-labelledby="recommendations-title" className="grid gap-3">
                <h2 id="recommendations-title" className="text-xl font-semibold">Recommendations</h2>
                <p role="status">Recommendations are unavailable right now. Refresh to try again.</p>
            </section>
        )
    }

    const sections = [
        { title: `Active ${organizationLabel}`, kind: 'organization', reconnect: false },
        { title: 'Recently active people', kind: 'person', reconnect: false },
        { title: `Reconnect with ${organizationLabel}`, kind: 'organization', reconnect: true },
        { title: 'Reconnect with people', kind: 'person', reconnect: true },
    ]

    return (
        <section aria-labelledby="recommendations-title" className="grid gap-4">
            <h2 id="recommendations-title" className="text-xl font-semibold">Recommendations</h2>
            <div className="grid gap-4 lg:grid-cols-2">
                {sections.map(section => {
                    const records = recommendations.filter(record =>
                        record.kind === section.kind && record.isReconnect === section.reconnect
                    )
                    return (
                        <Card key={section.title} size="sm">
                            <CardHeader><h3 className="font-semibold">{section.title}</h3></CardHeader>
                            <CardContent>
                                {records.length === 0 ? (
                                    <p className="text-muted-foreground">No recommendations yet.</p>
                                ) : (
                                    <ul className="divide-y">
                                        {records.map(record => {
                                            const isPerson = record.kind === 'person'
                                            const contacts: SuggestedContact[] = JSON.parse(record.contacts)
                                            const href = isPerson ? `/details/contacts/${record.id}`
                                                : organizationView ? null : `/details/schools/${record.id}`
                                            return (
                                                <li key={record.id} className="py-3 first:pt-0 last:pb-0">
                                                    {href ? <Link href={href} className={linkClass}>{record.name}</Link>
                                                        : <span className="font-medium">{record.name}</span>}
                                                    {isPerson && (
                                                        <p className="text-muted-foreground">
                                                            {formatRole(record.role)}{record.organization && ` · ${record.organization}`}
                                                        </p>
                                                    )}
                                                    <p className="text-muted-foreground">
                                                        {record.reason}{record.date && <> · <time dateTime={record.date}>{dateFormat.format(new Date(record.date))}</time></>}
                                                    </p>
                                                    {!isPerson && (
                                                        <details className="mt-2">
                                                            <summary className="w-fit cursor-pointer font-medium">Who to contact</summary>
                                                            {contacts.length ? (
                                                                <ul className="mt-2 space-y-1 pl-4">
                                                                    {contacts.map(contact => (
                                                                        <li key={contact.id}>
                                                                            <Link href={`/details/contacts/${contact.id}`} className={linkClass}>{contact.name}</Link>
                                                                            <span className="text-muted-foreground"> · {formatRole(contact.role)}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : <p className="mt-2 pl-4 text-muted-foreground">No suggested contacts are linked.</p>}
                                                        </details>
                                                    )}
                                                </li>
                                            )
                                        })}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </section>
    )
}
