import { PageActionLink } from '@/components/records/page-action-link'
import { Search } from "@/components/custom/searches/search";
import { Suspense } from "react";
import { ContactTableContainer } from './contact-table-container';


export default async function ContactManagementPage(
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
        return `/contacts?${search}`
    }

    

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-4 m-10">
            <PageActionLink href="/create/contacts" fullWidth>Add a Contact</PageActionLink>

            <Search placeholder={"Search contacts..."}/>

            <Suspense key={`${query}:${currentPage}`} fallback={<p role="status">Loading contacts…</p>}>
                <ContactTableContainer query={query} />
            </Suspense>
        </div>
    )
}


