'use server'
import { timeDetails } from '@/lib/detail-timing'
import { db } from '@/prisma/db'
import { revalidatePath } from 'next/cache'

function id(value: unknown) {
    if ((typeof value !== 'string' && typeof value !== 'number') || !/^\d+$/.test(String(value))) throw new Error('Invalid ID')
    const result = Number(value)
    if (!Number.isSafeInteger(result) || result <= 0) throw new Error('Invalid ID')
    return result
}
function refresh() { revalidatePath('/municipalities'); revalidatePath('/programs') }

export async function saveMunicipality(form: FormData) {
    const name = form.get('name')
    const mayor = form.get('mayor')
    if (typeof name !== 'string' || !name.trim() || typeof mayor !== 'string' || !mayor.trim()) return { error: 'Name and mayor are required.' }
    try {
        const data = { name: name.trim(), mayor: mayor.trim() }
        if (form.has('id')) {
            const municipalityId = id(form.get('id'))
            await db.transaction(async tx => {
                if (!await tx.orm.public.Municipality.where({ id: municipalityId }).first()) throw new Error('Missing municipality')
                await tx.orm.public.Municipality.where({ id: municipalityId }).update(data)
            })
        } else await db.orm.public.Municipality.create(data)
    } catch { return { error: 'Could not save municipality. Refresh and try again.' } }
    refresh()
    return { success: true as const }
}

export async function deleteMunicipality(form: FormData) {
    if (form.get('confirmation') !== 'delete') return { error: 'Type delete to confirm.' }
    try { await db.orm.public.Municipality.where({ id: id(form.get('id')) }).delete() }
    catch (error) {
        if (error && typeof error === 'object' && 'sqlState' in error && error.sqlState === '23503') return { error: 'Could not clear sponsorship links. Confirm the automatic-deletion migration has been applied and try again.' }
        return { error: 'Could not delete municipality. Refresh and try again.' }
    }
    refresh()
    return { success: true as const }
}

export async function getMunicipalityDetails(municipalityId: number, editing = false) {
    municipalityId = id(municipalityId)
    const [municipality, links] = await timeDetails('municipalities:query-group-1', () => Promise.all([
        db.orm.public.Municipality.where({ id: municipalityId }).first(),
        db.orm.public.MunicipalityPrograms.where({ municipalityId }).all().toArray(),
    ]))
    if (!municipality) throw new Error('Municipality not found')
    const ids = links.map(link => link.programId)
    const programs = editing ? await db.orm.public.Program.select('id', 'name', 'description').orderBy(p => p.name.asc()).all().toArray()
        : ids.length ? await db.orm.public.Program.where(p => p.id.in(ids)).select('id', 'name', 'description').orderBy(p => p.name.asc()).all().toArray() : []
    return { municipality, programs: programs.filter(p => ids.includes(p.id)), availablePrograms: editing ? programs.filter(p => !ids.includes(p.id)) : [] }
}

export async function changeMunicipalityProgram(form: FormData) {
    try {
        const municipalityId = id(form.get('municipality-id'))
        const programId = id(form.get('program-id'))
        const operation = form.get('operation')
        if (operation !== 'add' && operation !== 'remove') return { error: 'Choose a valid operation.' }
        await db.transaction(async tx => {
            // Serialize changes for the same municipality to make repeated assignment safe.
            if (!await tx.orm.public.Municipality.where({ id: municipalityId }).forUpdate().first()) throw new Error('Missing municipality')
            if (operation === 'remove') await tx.orm.public.MunicipalityPrograms.where({ municipalityId, programId }).delete()
            else {
                if (!await tx.orm.public.Program.where({ id: programId }).first()) throw new Error('Missing program')
                if (!await tx.orm.public.MunicipalityPrograms.where({ municipalityId, programId }).first()) {
                    await tx.orm.public.MunicipalityPrograms.create({ municipalityId, programId })
                }
            }
        })
    } catch { return { error: 'Could not update sponsorship. Refresh and check that the program still exists.' } }
    refresh()
    return { success: true as const }
}
