import { redirect } from 'next/navigation'

// Preserve bookmarks to the former standalone page, including the selected view.
export default async function RecommendationsPage({ searchParams }: {
    searchParams: Promise<{ view?: string }>
}) {
    const organizationView = (await searchParams).view === 'organizations'
    redirect(organizationView ? '/dashboard?view=organizations' : '/dashboard')
}
