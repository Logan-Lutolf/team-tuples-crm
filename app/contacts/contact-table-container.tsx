import { db } from "@/prisma/db"
import { ContactTable } from "./contact-table"

interface ContactTableContainerProps {
    query: string
    page: number
}

export async function ContactTableContainer({ query, page }: ContactTableContainerProps) {
    const recordsPerPage = 20
    const currentPage = Number.isSafeInteger(page) && page > 0 ? page : 1
    // Escape LIKE wildcards so searching keeps its literal substring behavior.
    const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`
    const contactQuery = query
        ? db.orm.public.Contact.where((contact) => contact.name.ilike(pattern))
        : db.orm.public.Contact

    const [contacts, branches, availableSchools] = await Promise.all([
        contactQuery.orderBy([(contact) => contact.updatedAt.desc(), (contact) => contact.id.desc()])
            .offset((currentPage - 1) * recordsPerPage)
            .limit(recordsPerPage).all().toArray(),
        db.orm.public.Branch.select("id", "name").all().toArray(),
        db.orm.public.School.select("id", "name").all().toArray(),
    ])

    return (
        <ContactTable
            data={contacts}
            branches={branches}
            availableSchools={availableSchools}
        />
    )
}
