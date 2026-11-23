// import { DashboardTable } from '@/components/records/dashboard-table'
// import { PageActionLink } from '@/components/records/page-action-link'
// import { RecordLink } from '@/components/records/record-link'
// import Link from "next/link"
// import { db } from "@/prisma/db"
// import { Search } from "@/components/custom/searches/search"
// import { Suspense } from "react"
// import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Plus, Trash } from 'lucide-react'
// import { Button } from '@/components/ui/button'

import { Search } from "@/components/custom/searches/search";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Suspense } from "react";
import { EmployeeTableContainer } from "../employee-management/employee-table-container";
import SkeletonTable from "../employee-management/loading";
import { AddBranchForm } from "./add-branch-form";
import { BranchTableContainer } from "./branch-table-container";
import { Plus } from "lucide-react";

// export default async function BranchesPage({ searchParams }: {
//     searchParams?: Promise<{ search?: string; page?: string }>
// }) {
//     const params = await searchParams
//     const search = params?.search?.trim() ?? ""
//     const [branches, employees] = await Promise.all([
//         db.orm.public.Branch.orderBy((branch) => branch.name.asc()).all().toArray(),
//         db.orm.public.Person.select("id", "name", "email").orderBy((employee) => employee.name.asc()).all().toArray(),  // Needs fixing
//     ])
//     const chiefs = new Map(employees.map((employee) => [employee.id, employee.name]))
//     const filtered = branches.filter((branch) => [branch.name, branch.region, branch.institute, branch.chiefId ? chiefs.get(branch.chiefId) : ""]
//         .some((value) => value?.toLowerCase().includes(search.toLowerCase())))
//     const size = 20
//     const pages = Math.max(1, Math.ceil(filtered.length / size))
//     const requested = Number(params?.page ?? 1)
//     const page = Math.min(pages, Number.isSafeInteger(requested) && requested > 0 ? requested : 1)
//     const rows = filtered.slice((page - 1) * size, page * size)
//     function href(next: number) {
//         return `/branches?${new URLSearchParams({ ...(search ? { search } : {}), page: String(next) })}`
//     }
//     return <div className="m-10 flex min-w-0 flex-1 flex-col gap-4">
//         {/* <PageActionLink href="/create/branches" fullWidth>Add a Branch</PageActionLink> */}
//         <Button><Plus/> Add a Branch </Button>
//         <Suspense fallback={<p role="status">Loading search…</p>}><Search placeholder="" /></Suspense>
//         <DashboardTable>
//             <TableHeader><TableRow>
//                 <TableHead>Name</TableHead><TableHead>Region</TableHead><TableHead>Institute</TableHead><TableHead>Chief</TableHead><TableHead>Actions</TableHead>
//             </TableRow></TableHeader>
//             <TableBody>
//                 {rows.map((branch) => <TableRow key={branch.name}>
//                     <TableCell><RecordLink type="branches" id={1}>{branch.name}</RecordLink></TableCell><TableCell>{branch.region}</TableCell>
//                     <TableCell>{branch.institute || "—"}</TableCell><TableCell><RecordLink type="employees" id={branch.chiefId}>{branch.chiefId ? chiefs.get(branch.chiefId) ?? "Unassigned" : "Unassigned"}</RecordLink></TableCell>
//                     <TableCell><div className="flex flex-wrap items-center justify-center gap-2">
//                         {/* <PageActionLink href={`/details/branches/${branch.name}`}>View details</PageActionLink> */}
//                         <Button disabled>Details (disabled)</Button>
//                         {/* <PageActionLink href={`/details/branches/${branch.name}/delete`} destructive><Trash/></PageActionLink> */}
//                         <Button disabled variant="destructive"><Trash/></Button>
//                     </div></TableCell>
//                 </TableRow>)}
//                 {!rows.length && <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
//                     {search ? "No branches match your search." : "No branches yet. Add a branch to make it available in school and contact forms."}
//                 </TableCell></TableRow>}
//             </TableBody>
//         </DashboardTable>
//         <nav aria-label="Branch pagination" className="flex items-center justify-between gap-4 text-sm">
//             {page > 1 ? <Link href={href(page - 1)} className="underline">Previous</Link> : <span className="text-muted-foreground">Previous</span>}
//             <span>{filtered.length} {filtered.length === 1 ? "branch" : "branches"} · Page {page} of {pages}</span>
//             {page < pages ? <Link href={href(page + 1)} className="underline">Next</Link> : <span className="text-muted-foreground">Next</span>}
//         </nav>
//     </div>
// }



export default async function BranchesPage(
    {searchParams} : {
        searchParams?: Promise<{ search?: string; cursor?: string; dir?: "prev" | "next"}>
    }
) {
    const params = await searchParams
    const search = params?.search ?? undefined

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-4 m-10">
            <Dialog>
                <DialogTrigger render={<Button><Plus/> Add a Branch</Button>}/>

                <DialogContent>
                    <AddBranchForm />
                </DialogContent>
            </Dialog>
            <Search placeholder={"Search branches..."}/>

            <div className="min-w-0 overflow-auto">
                <Suspense key={search} fallback={<SkeletonTable />}>
                    <BranchTableContainer search={search} />
                </Suspense>
            </div>
        
        </div>
    )
}