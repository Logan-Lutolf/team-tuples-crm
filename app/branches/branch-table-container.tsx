import { DataTable } from "@/components/ui/data-table"
import { EmployeePerson } from "../types"
import { db } from "@/prisma/db"
import { getBranches } from "../actions/branches"
import { BranchTable } from "./branch-table"



export async function BranchTableContainer({search}: {search?: string | undefined}) {
    
    const branches = await db.orm.public.Branch
        .orderBy((b) => b.name.asc())
        .all()
        .toArray()

    const filtered = search
        ? branches.filter((b) =>
            [b.name, b.region, b.institute].some((v) =>
                v?.toLowerCase().includes(search.toLowerCase())
            )
        )
    : branches
    
    return (
        <BranchTable data={filtered}/>
    )
}