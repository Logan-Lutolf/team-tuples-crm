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
        

    const [c, i] = cursor?.split("|") ?? []
    const parsed = c && i ? { createdAt: new Date(c), id: i } : undefined // Number(i) if id is numeric

    const base = db.orm.public.Employee
        .where({name: search})
        .orderBy(dir === "prev"
            ? [(e) => e.createdAt.asc(), (e) => e.id.asc()]
            : [(e) => e.createdAt.desc(), (e) => e.id.desc()])

    const rows = await (parsed ? base.cursor(parsed) : base)
        .limit(20)
        .all()
        .toArray()

    const employees = dir === "prev" ? rows.reverse() : rows

    const first = employees[0]
    const last = employees[employees.length - 1]

    const prevBookmark = first ? first.createdAt + "|" + first.id.toString() : ""
    const nextBookmark = last ? last.createdAt + "|" + last.id.toString() : ""

    

    

    return (
        <>
            <EmployeeTable data={employees}/>

            <Pagination>
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
            </Pagination>
        </>
        
    )
}