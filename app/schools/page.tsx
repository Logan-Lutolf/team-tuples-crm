import { PageActionLink } from '@/components/records/page-action-link'
import { Suspense } from "react";
import { OrganizationTableContainer } from './organization-table-container';


// Add pagination to employee list
// Edit employee functionality
// Filtering by role


export default async function EmployeeManagementPage(
    {searchParams} : {
        searchParams?: Promise<{ search?: string; query?: string; page?: string }>
    }
) {
    const params = await searchParams
    const query = params?.search ?? params?.query ?? ''



    const requestedPage = Number(params?.page ?? 1)
    const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    function pageHref(page: number) {
        const search = new URLSearchParams({ page: String(page) })
        if (query) search.set("search", query)
        return `/schools?${search}`
    }
    const RECORDS_PER_PAGE = 20 


    

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-4 m-10">
            <PageActionLink href="/create/schools" fullWidth>Add an Organization</PageActionLink>

            {/* <Search placeholder={""}/> */}

            <Suspense key={`${query}:${currentPage}`} fallback={<p role="status">Loading schools…</p>}>
                <OrganizationTableContainer query={''}/>
            </Suspense>

        </div>
    )
}
