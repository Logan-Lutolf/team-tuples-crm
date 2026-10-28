import { db } from "@/prisma/db";
import { AddSchoolForm } from "./add-school-form";
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


    const RECORDS_PER_PAGE = 20 


    

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-4 m-10">
            <Dialog>
                <DialogTrigger render={<Button>Add a School</Button>}/>

                <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Add a School</DialogTitle>
                    </DialogHeader>
                    <AddSchoolForm />
                </DialogContent>
            </Dialog>
            
            <Search placeholder={""}/>

            <SchoolTableContainer query={query} page={Number(params?.page ?? 1)} />

            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious></PaginationPrevious>
                    </PaginationItem>

                    <PaginationItem>
                        <PaginationEllipsis></PaginationEllipsis>
                    </PaginationItem>

                    <PaginationItem>
                        <PaginationNext></PaginationNext>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
}


