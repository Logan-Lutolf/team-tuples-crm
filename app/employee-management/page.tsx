import { AddEmployeeForm } from "./forms/add-employee-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/custom/search";
import { EmployeeTableContainer } from "./employee-table-container";
import { Suspense } from "react";


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
                <DialogTrigger render={<Button>Add an Employee</Button>}/>

                <DialogContent>
                    <AddEmployeeForm />
                </DialogContent>
            </Dialog>
            <Search placeholder={""}/>

            <div className="min-w-0 overflow-auto">
                <Suspense key={query} fallback={<p role="status">Loading employees…</p>}>
                    <EmployeeTableContainer query={query} page={1} />
                </Suspense>
            </div>
        
        </div>
    )
}


