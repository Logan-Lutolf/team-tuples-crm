import { PageActionLink } from '@/components/records/page-action-link'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search } from "@/components/custom/searches/search";
import { ContactTableContainer } from "./contact-table-container";
import { Suspense } from "react";
import { NewContactTableContainer } from './new-contact-table-container';


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
    const RECORDS_PER_PAGE = 20 


    

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-4 m-10">
            <PageActionLink href="/create/contacts" fullWidth>Add a Contact</PageActionLink>

            <Search placeholder={"Search contacts..."}/>

            <Suspense key={`${query}:${currentPage}`} fallback={<p role="status">Loading contacts…</p>}>
                <NewContactTableContainer query={query} />
            </Suspense>
        </div>
    )
}


