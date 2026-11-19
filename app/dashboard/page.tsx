import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentEmployee } from '@/lib/current-employee'
import { AdminDashboardContainer } from './containers/admin-dashboard-container'
import { Recommendations } from './recommendations'

export default async function Dashboard({ searchParams }: {
    searchParams: Promise<{ view?: string }>
}) {
    const employee = await currentEmployee()
    if (!employee) redirect('/login')
    const organizationView = (await searchParams).view === 'organizations'

    return <>
        {employee.roles.includes('ADMIN') && <AdminDashboardContainer />}
        <div className="m-6 grid gap-6 lg:m-10">
            <nav aria-label="Recommendation view" className="flex gap-4">
                <Link href="/dashboard" aria-current={!organizationView ? 'page' : undefined} className="underline">Schools</Link>
                <Link href="/dashboard?view=organizations" aria-current={organizationView ? 'page' : undefined} className="underline">Other organizations</Link>
            </nav>
            <Recommendations organizationView={organizationView} />
        </div>
    </>
}
