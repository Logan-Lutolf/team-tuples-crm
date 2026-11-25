import { BranchCard } from "@/components/custom/branch-card";
import { Branch } from "../types";



export function BranchGrid({branches}: {branches: Branch[]}) {
    return (
        <div className="px-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 items-center justify-items-center">
            {branches.map((b) => {
                return <BranchCard key={b.id} name={b.name} imgUrl={"/prague.jpg"}/>
            })}
        </div>
    )
}