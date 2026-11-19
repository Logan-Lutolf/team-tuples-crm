// Written by Claude

"use server"

import { db } from "@/prisma/db"

export async function searchEmployees(query: string) {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []

    // Same pattern as your EmployeeTableContainer: load, then filter in JS.
    // If your ORM supports a case-insensitive "contains" filter, use it instead.
    const records = await db.orm.public.Employee.include("person").all().toArray()

    return records
        .filter(e => e.person.name.toLowerCase().includes(q))
        .slice(0, 8)
        .map(e => ({ id: e.personId, name: e.person.name }))
}