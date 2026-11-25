import { db } from "@/prisma/db";
import { getBranches } from "../actions/branches";
import { BranchGrid } from "./branch-grid";
import { Branch } from "../types";



export async function BranchGridContainer() {
    const branches: Branch[] = await db.orm.public.Branch.all().toArray()
    if (!branches) return "Error: branches not found."

    return <BranchGrid branches={branches}/>
}