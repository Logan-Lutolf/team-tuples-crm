import { db } from "@/prisma/db";
import { AddContactForm } from "./forms/add-contact";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Contract } from "@/prisma/contract";
import { DefaultModelRow } from "@prisma/orm-postgres/orm-client";
import { Filter } from "lucide-react";
import { Search } from "@/components/custom/search";
import { SchoolTableContainer } from "./school-table-container";
import { Suspense } from "react";


// Add pagination to employee list
// Edit employee functionality
// Filtering by role


export default async function EmployeeManagementPage(
    {searchParams} : {
        searchParams?: Promise<{ query?: string; page?: string }>
    }
) {
    const params = await searchParams
    const query = params?.query ?? ''
    const branches = await db.orm.public.Branch.select("id", "name").all().toArray()


    const requestedPage = Number(params?.page ?? 1)
    const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    function pageHref(page: number) {
        const search = new URLSearchParams({ page: String(page) })
        if (query) search.set("query", query)
        return `/schools?${search}`
    }
    const RECORDS_PER_PAGE = 20 


    

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-4 m-10">
            <Dialog>
                <DialogTrigger render={<Button>Add a School</Button>}/>

                <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Add a School</DialogTitle>
                    </DialogHeader>
                    <AddSchoolForm branches={branches} />
                </DialogContent>
            </Dialog>
            
            <Search placeholder={""}/>

            <Suspense key={`${query}:${currentPage}`} fallback={<p role="status">Loading schools…</p>}>
                <SchoolTableContainer query={query} page={currentPage} />
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


