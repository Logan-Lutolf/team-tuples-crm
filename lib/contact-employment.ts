export class EmploymentValidationError extends Error {}

export function employmentId(value: FormDataEntryValue | null): number {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new EmploymentValidationError('Choose a valid contact, school, or employment record.')
    const number = Number(value)
    if (!Number.isSafeInteger(number) || number <= 0) throw new EmploymentValidationError('Choose a valid contact, school, or employment record.')
    return number
}
function date(value: FormDataEntryValue | null, required: boolean): string | null {
    if (value === null || value === '') {
        if (required) throw new EmploymentValidationError('Start date is required.')
        return null
    }
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new EmploymentValidationError('Enter a valid employment date.')
    const parsed = new Date(`${value}T00:00:00.000Z`)
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new EmploymentValidationError('Enter a valid employment date.')
    return parsed.toISOString()
}
export function employmentData(form: FormData, allowUnassignedSchool = false) {
    const title = form.get('job-title')
    const notes = form.get('notes')
    if (typeof title !== 'string' || !title.trim()) throw new EmploymentValidationError('Job title is required.')
    if (notes !== null && typeof notes !== 'string') throw new EmploymentValidationError('Enter valid notes.')
    const startDate = date(form.get('start-date'), true)!
    const endDate = date(form.get('end-date'), false)
    if (endDate && endDate < startDate) throw new EmploymentValidationError('End date must be on or after the start date.')
    return { schoolId: allowUnassignedSchool && !form.get('school-id') ? null : employmentId(form.get('school-id')), jobTitle: title.trim(), startDate, endDate, notes: notes?.trim() || null }
}
