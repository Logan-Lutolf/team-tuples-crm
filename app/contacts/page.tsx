import { PageActionLink } from '@/components/records/page-action-link'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search } from "@/components/custom/search";
import { ContactTableContainer } from "./contact-table-container";
import { Suspense } from "react";


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

            <Search placeholder={""}/>

            <Suspense key={`${query}:${currentPage}`} fallback={<p role="status">Loading contacts…</p>}>
                <ContactTableContainer query={query} page={currentPage} />
            </Suspense>

            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious href={pageHref(Math.max(1, currentPage - 1))} aria-disabled={currentPage === 1} className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined} tabIndex={currentPage === 1 ? -1 : undefined} />
                    </PaginationItem>

                    <PaginationItem>
                        <PaginationEllipsis></PaginationEllipsis>
                    </PaginationItem>

                    <PaginationItem>
                        <PaginationNext href={pageHref(currentPage + 1)} />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}


