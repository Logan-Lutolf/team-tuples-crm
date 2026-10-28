import { AddEmployeeForm } from "./forms/add-employee-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/custom/search";
import { EmployeeTableContainer } from "./employee-table-container";


export default async function EmployeeManagementPage(
    {searchParams} : {
        searchParams?: Promise<{ query?: string; page?: string }>
    }
) {
    const params = await searchParams
    const query = params?.query ?? ''


    const RECORDS_PER_PAGE = 20 


    

    return (
        <div className="mx-auto flex h-full min-h-0 w-full min-w-0 max-w-6xl flex-col gap-4 p-10">
            <Dialog>
                <DialogTrigger render={<Button>Add an Employee</Button>}/>

                <DialogContent>
                    <AddEmployeeForm />
                </DialogContent>
            </Dialog>
            <div>
                <Search placeholder={""}/>
                <div className="min-h-0 min-w-0 flex-1 overflow-auto">
                    <EmployeeTableContainer query={query} page={1} />
                </div>
            </div>
        
        </div>
    )
}


