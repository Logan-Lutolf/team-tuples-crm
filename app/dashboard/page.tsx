import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentEmployee } from '@/lib/current-employee'
import { AdminDashboardContainer } from './containers/admin-dashboard-container'
import { Recommendations } from './recommendations'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { RefreshCw } from 'lucide-react'

export default async function Dashboard({ searchParams }: {
    searchParams: Promise<{ view?: string }>
}) {
    const employee = await currentEmployee()
    if (!employee) redirect('/login')
    const organizationView = (await searchParams).view === 'organizations'

    return <>
        {/* {employee.roles.includes('ADMIN') && <AdminDashboardContainer />} */}
        
        <div className="m-6 grid gap-6 lg:m-10">
            <Accordion>
            <AccordionItem>
                <AccordionTrigger className="flex flex-row gap-2 items-center"><RefreshCw/> Click to see updates</AccordionTrigger>
                <AccordionContent>
                    <h3>25/11/2026 - Update Panel:</h3>
                    <p>The dashboard now has this simple update section. We will use this to notify you all of any changes we make.
                        <br/>
                        That way, if you are coming back to test the app after some time, you'll know what's new!
                    </p>
                    <h3>25/11/2026 - Branches:</h3>
                    <p>The branch page no longer has a table. Instead, it displays a grid of all nine branches.
                        <br/>
                        If you click a branch, it will take you to the details page for that branch.
                    </p>
                    <h3>25/11/2026 - Column Visibility:</h3>
                    <p>You can now select which columns you'd like to see in a given data table!
                        <br/>
                        Let us know if you want us to add specific columns to any given table.
                    </p>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
            
            <nav aria-label="Recommendation view" className="flex gap-4">
                <Link href="/dashboard" aria-current={!organizationView ? 'page' : undefined} className="underline">Schools</Link>
                <Link href="/dashboard?view=organizations" aria-current={organizationView ? 'page' : undefined} className="underline">Other organizations</Link>
            </nav>
            <Recommendations organizationView={organizationView} />
        </div>
    </>
}
