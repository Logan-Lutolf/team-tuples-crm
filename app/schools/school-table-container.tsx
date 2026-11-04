import { db } from "@/prisma/db"
import { SchoolTable } from "./school-table"

export async function SchoolTableContainer({ query, page }: { query: string; page: number }) {
    const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`
    const schools = query ? db.orm.public.School.where(s => s.name.ilike(pattern)) : db.orm.public.School
    const rows = await schools.orderBy([s => s.updatedAt.desc(), s => s.id.desc()])
        .offset((page - 1) * 20).limit(20).all().toArray()
    return <SchoolTable data={rows} />
}
