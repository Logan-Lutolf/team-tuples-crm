import { db } from "@/prisma/db";
import { AddEmployeeForm } from "./add-employee-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Contract } from "@/prisma/contract";
import { DefaultModelRow } from "@prisma/orm-postgres/orm-client";
import { Filter } from "lucide-react";
import { Search } from "@/components/custom/search";
import { EmployeeTableContainer } from "./employee-table-container";


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
        <div className="flex flex-col gap-4 m-10">
            <Dialog>
                <DialogTrigger render={<Button>Add an Employee</Button>}/>

                <DialogContent>
                    <AddEmployeeForm />
                </DialogContent>
            </Dialog>
            
            <Search placeholder={""}/>

            <EmployeeTableContainer query={query} page={1} />
        </div>
    )
}


