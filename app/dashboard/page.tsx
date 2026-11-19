import { redirect } from 'next/navigation'
import { EVA_EMAIL } from '@/lib/branch-edit-access'
import { currentEmployee } from '@/lib/current-employee'
import { AdminDashboardContainer } from './containers/admin-dashboard-container'
import { Recommendations } from './recommendations'

export default async function Dashboard() {
    const employee = await currentEmployee()
    if (!employee) redirect('/login')

    return (
        <>
            {employee.roles.includes('ADMIN') && <AdminDashboardContainer />}
            <div className="mx-4 mb-10 mt-6 sm:mx-10">
                <Recommendations organizationView={employee.email.toLowerCase() === EVA_EMAIL} />
            </div>
        </>
    )
}
