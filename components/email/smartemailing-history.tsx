import type { SmartEmailContactDetails } from '@/lib/smartemailing-data'

function date(value: string | null) {
    return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Prague' }).format(new Date(value)) : 'Not available'
}
function details(json: string) { return JSON.parse(json) as { deviceType?: string; bounceType?: string; reason?: string } }
export function SmartEmailingHistory({ data }: { data: SmartEmailContactDetails }) {
    const { status, profile, delivered, opened, clicked, unsubscribed, bounced } = data
    return <section className="grid min-w-0 gap-4 rounded-lg border p-4" aria-labelledby="smartemailing-history">
        <h2 id="smartemailing-history" className="text-lg font-semibold">SmartEmailing newsletters</h2>
        {status.lastError && <p role="status">The last sync failed. Previously imported data is shown.</p>}
        {status.catchingUp && <p role="status">Contact import is still catching up.</p>}
        <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="font-medium">Latest SmartEmailing email delivered</dt><dd>{delivered ? `${delivered.campaignName} · ${date(delivered.occurredAt)}` : 'No delivery in imported history'}</dd>{delivered && <dd className="text-sm">{data.latestMessageOpened ? 'Open reported' : 'No open reported'} · {data.latestMessageClicked ? 'Click reported' : 'No click reported'}</dd>}</div>
            <div><dt className="font-medium">Latest open / click reported</dt><dd>Open: {date(opened?.occurredAt ?? null)}<br />Click: {date(clicked?.occurredAt ?? null)}</dd></div>
            <div><dt className="font-medium">Subscription status</dt><dd>{profile ? (profile.blacklisted ? 'Blacklisted in SmartEmailing' : profile.lists.some(list => list.status === 'unsubscribed') ? `Unsubscribed (${unsubscribed ? date(unsubscribed.occurredAt) : 'date unavailable'})` : profile.lists.length ? 'Subscribed' : 'No subscriptions reported') : 'No current SmartEmailing contact data'}</dd></div>
            <div><dt className="font-medium">Address delivery problems</dt><dd>{profile?.hardBounced ? 'Permanent bounce reported — review this address.' : profile?.softBounces ? `${profile.softBounces} consecutive temporary bounces reported` : 'No current bounce flag reported'}</dd>{bounced && <dd>Latest bounce: {date(bounced.occurredAt)} · {details(bounced.detailsJson).bounceType} · {details(bounced.detailsJson).reason?.replaceAll('_', ' ')}</dd>}</div>
        </dl>
        <div><h3 className="font-medium">SmartEmailing lists</h3>{profile?.lists.length ? <ul className="list-inside list-disc">{profile.lists.map(list => <li key={list.id}>{list.name} · {list.status === 'confirmed' ? 'Subscribed' : 'Unsubscribed'}</li>)}</ul> : <p>No current list memberships imported.</p>}</div>
        <details><summary className="cursor-pointer font-medium">Recent SmartEmailing activity</summary>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Date (Prague)</th><th className="p-2">Newsletter / email</th><th className="p-2">Activity</th></tr></thead>
                <tbody>{data.history.map(event => <tr className="border-t" key={event.id}><td className="p-2">{date(event.occurredAt)}</td><td className="p-2">{event.campaignName}{event.subject && event.subject !== event.campaignName && <div>{event.subject}</div>}<span className="block">{event.campaignType.replaceAll('_', ' ')}</span></td><td className="p-2">{event.type.replace('email.', '').replaceAll('_', ' ')}{details(event.detailsJson).deviceType && ` (${details(event.detailsJson).deviceType})`}{event.type === 'email.bounced' && ` · ${details(event.detailsJson).bounceType} · ${details(event.detailsJson).reason}`}</td></tr>)}</tbody>
            </table>{!data.history.length && <p>No imported activity for this email address.</p>}</div>
            {data.history.length === 50 && <p className="text-sm">Showing the latest 50 events.</p>}
        </details>
    </section>
}
