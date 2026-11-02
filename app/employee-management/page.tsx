import { AddEmployeeForm } from "./forms/add-employee-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/custom/search";
import { EmployeeTableContainer } from "./employee-table-container";


export default async function EmployeeManagementPage(
    {searchParams} : {
        searchParams?: Promise<{ search?: string; cursor?: string; dir?: string}>
    }
) {
    const params = await searchParams
    const search = params?.search ?? undefined
    const cursor = params?.cursor ?? undefined
    const dir = params?.dir === "prev" ? "prev" : "next"

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
                <EmployeeTableContainer search={search} cursor={cursor} dir={dir} />
            </div>
        
        </div>
    )
}


