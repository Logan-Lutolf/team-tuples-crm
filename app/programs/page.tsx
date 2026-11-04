import Link from 'next/link'
import { or } from '@prisma/orm-postgres/orm-client'
import { db } from '@/prisma/db'
import { Search } from '@/components/custom/search'
import { Suspense } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ProgramDialog } from './program-dialog'

export default async function ProgramsPage({ searchParams }: { searchParams?: Promise<{ search?: string; page?: string }> }) {
    const params = await searchParams
    const search = params?.search?.trim() ?? ''
    const requested = Number(params?.page ?? 1)
    const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1
    const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`
    const query = search ? db.orm.public.Program.where(p => or(p.name.ilike(pattern), p.description.ilike(pattern))) : db.orm.public.Program
    const result = await query.orderBy([p => p.name.asc(), p => p.id.asc()]).offset((page - 1) * 20).limit(21).all().toArray()
    const rows = result.slice(0, 20)
    const href = (page: number) => `/programs?${new URLSearchParams({ search, page: String(page) })}`
    return <div className="m-10 flex min-w-0 flex-1 flex-col gap-4">
        <ProgramDialog />
        <Suspense fallback={<p role="status">Loading search…</p>}>
            <Search placeholder="" />
        </Suspense>
        <Table className="border">
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map(program => <TableRow key={program.id}>
                <TableCell className="font-medium">{program.name}</TableCell><TableCell className="max-w-md whitespace-normal"><p className="line-clamp-3">{program.description || '—'}</p></TableCell>
                <TableCell><div className="flex gap-2"><ProgramDialog program={program} mode="view" /><ProgramDialog program={program} mode="delete" /></div></TableCell>
            </TableRow>)}{!rows.length && <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground">{search ? 'No programs match your search.' : page > 1 ? 'No more programs.' : 'No programs yet. Add a program to get started.'}</TableCell></TableRow>}</TableBody>
        </Table>
        <nav aria-label="Program pagination" className="flex items-center justify-between text-sm">
            {page > 1 ? <Link href={href(page - 1)} className="underline">Previous</Link> : <span className="text-muted-foreground">Previous</span>}
            <span>Page {page}</span>
            {result.length > 20 ? <Link href={href(page + 1)} className="underline">Next</Link> : <span className="text-muted-foreground">Next</span>}
        </nav>
    </div>
}
