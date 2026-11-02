import { db } from "@/prisma/db";
import { EmployeeTable } from "./employee-table"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { NextPage, PrevPage } from "@/components/custom/next-page";


interface EmployeeTableContainerProps {
    search: string | undefined
    cursor: string | undefined
    dir: "next" | "prev"
}


export async function EmployeeTableContainer({search, cursor, dir} : EmployeeTableContainerProps) {
    const NUM_RECORDS = 10
    
    const baseEmployees = await db.orm.public.Employee
        .orderBy([(e) => e.createdAt.desc(), (e) => e.id.desc()])
        .limit(NUM_RECORDS)
        .all()


    const employees = baseEmployees.filter((e) => {
        return e.name.toLowerCase().includes(search?.toLowerCase() ?? "")
    })

    return (
        <>
            <EmployeeTable data={employees}/>

            {/* <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PrevPage bookmark={prevBookmark}/>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationEllipsis/>
                    </PaginationItem>
                    <PaginationItem>
                        <NextPage bookmark={nextBookmark}/>
                    </PaginationItem>
                </PaginationContent>
            </Pagination> */}
        </>
        
    )
}