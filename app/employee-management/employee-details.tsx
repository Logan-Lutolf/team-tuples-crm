import { notFound } from 'next/navigation'
import { db } from '@/prisma/db'
import { RecordLink } from '@/components/records/record-link'

export async function EmployeeDetails({ employeeId }: { employeeId: number }) {
    const [employee, assignments, interactions, participationLinks, chiefOf, person] = await Promise.all([
        db.orm.public.Employee.where({ personId: employeeId }).first(),
        db.orm.public.EmployeeAssignment.where({ employeeId }).all().toArray(),
        db.orm.public.Interaction.where({ employeeId }).orderBy(i => i.contactedAt.desc()).all().toArray(),
        db.orm.public.ParticipationEmployees.where({ employeeId }).all().toArray(),
        db.orm.public.Branch.where({ chiefId: employeeId }).select('id', 'name').all().toArray(),
        db.orm.public.Person.where({id: employeeId}).first()
    ])
    if (!employee && !person) notFound()
    const participationIds = participationLinks.map(p => p.particpationId)
    const participations = participationIds.length ? await db.orm.public.Participation.where(p => p.id.in(participationIds)).orderBy(p => p.startDate.desc()).all().toArray() : []
    const branchIds = [...new Set(assignments.flatMap(a => a.branchId ? [a.branchId] : []))]
    const programIds = [...new Set([...assignments.flatMap(a => a.programId ? [a.programId] : []), ...participations.map(p => p.programId), ...interactions.flatMap(i => i.programId ? [i.programId] : [])])].filter((id): id is number => id !== null)
    const orgIds = [...new Set([...participations.map(p => p.organizationId), ...interactions.flatMap(i => i.organizationId ? [i.organizationId] : [])])].filter((id): id is number => id !== null)
    const contactIds = [...new Set(interactions.map(i => i.personId))].filter((id): id is number => id !== null)
    const [branches, programs, schools, contacts] = await Promise.all([
        branchIds.length ? db.orm.public.Branch.where(b => b.id.in(branchIds)).select('id', 'name').all().toArray() : [],
        programIds.length ? db.orm.public.Program.where(p => p.id.in(programIds)).select('id', 'name').all().toArray() : [],
        orgIds.length ? db.orm.public.Organization.where(s => s.id.in(orgIds)).select('id', 'name').all().toArray() : [],
        contactIds.length ? db.orm.public.Person.where(c => c.id.in(contactIds)).select('id', 'name').all().toArray() : [],
    ])
    if (!person) return notFound()
    const name = (rows: { id: number; name: string }[], id: number | null) => id === null ? 'Unassigned / deleted' : rows.find(r => r.id === id)?.name ?? `#${id}`
    return <article className="grid gap-6">
        <h1 className="text-2xl font-semibold">{person.name}</h1>
        <dl className="grid gap-4 sm:grid-cols-2">{Object.entries({ Email: person.email, Phone: person.phone || '—',  Address: person.address ? Object.values(person.address).join(', ') : '—', Created: person.createdAt, Updated: person.updatedAt }).map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div>)}</dl>
        <section className="grid gap-3 rounded-lg border p-4"><h2 className="font-semibold">Assignments ({assignments.length})</h2>{assignments.map(a => <div key={a.id}>{a.role.replaceAll('_', ' ')} · {a.branchId ? <RecordLink type="branches" id={a.branchId}>{name(branches, a.branchId)}</RecordLink> : 'No branch scope'} · {a.programId ? <RecordLink type="programs" id={a.programId}>{name(programs, a.programId)}</RecordLink> : 'No program scope'}{a.region ? ` · Region ${a.region}` : ''}</div>)}</section>
        <section className="grid gap-3 rounded-lg border p-4"><h2 className="font-semibold">Chief of</h2>{chiefOf.length ? chiefOf.map(b => <RecordLink key={b.id} type="branches" id={b.id}>{b.name}</RecordLink>) : <p>No branches.</p>}</section>
        <section className="grid gap-3 rounded-lg border p-4"><h2 className="font-semibold">Participations ({participations.length})</h2>{participations.map(p => <p key={p.id}>{p.name} · <RecordLink type="programs" id={p.programId}>{name(programs, p.programId)}</RecordLink> · <RecordLink type="schools" id={p.organizationId}>{name(schools, p.organizationId)}</RecordLink> · {p.startDate}</p>)}</section>
        <section className="grid gap-3 rounded-lg border p-4"><h2 className="font-semibold">Contact history ({interactions.length})</h2>{interactions.map(i => <p key={i.id}>{i.contactedAt} · <RecordLink type="contacts" id={i.personId}>{name(contacts, i.personId)}</RecordLink> · {i.mode.replaceAll('_', ' ')}{i.organizationId && <> · <RecordLink type="schools" id={i.organizationId}>{name(schools, i.organizationId)}</RecordLink></>}{i.programId && <> · <RecordLink type="programs" id={i.programId}>{name(programs, i.programId)}</RecordLink></>}</p>)}</section>
    </article>
}
