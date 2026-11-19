import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentEmployee } from '@/lib/current-employee'
import { Recommendations } from '@/app/dashboard/recommendations'

export default async function RecommendationsPage({ searchParams }: {
    searchParams: Promise<{ view?: string }>
}) {
    if (!await currentEmployee()) redirect('/login')
    const organizationView = (await searchParams).view === 'organizations'
    return <article className="m-6 grid gap-6 lg:m-10">
        <nav aria-label="Recommendation view" className="flex gap-4">
            <Link href="/recommendations" aria-current={!organizationView ? 'page' : undefined} className="underline">Schools</Link>
            <Link href="/recommendations?view=organizations" aria-current={organizationView ? 'page' : undefined} className="underline">Other organizations</Link>
        </nav>
        <Recommendations organizationView={organizationView} />
    </article>
}
