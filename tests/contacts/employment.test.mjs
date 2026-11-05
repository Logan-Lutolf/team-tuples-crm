import { test } from 'node:test'
import assert from 'node:assert/strict'
import { employmentData, employmentId } from '../../lib/contact-employment.ts'
const form = values => { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data }
const base = { 'school-id': '1', 'job-title': ' Teacher ', 'start-date': '2024-02-29', 'end-date': '', notes: ' Notes ' }
test('valid leap date and ongoing period normalize correctly', () => {
    assert.deepEqual(employmentData(form(base)), { schoolId: 1, jobTitle: 'Teacher', startDate: '2024-02-29T00:00:00.000Z', endDate: null, notes: 'Notes' })
})
test('invalid calendar dates and inverted periods are rejected', () => {
    for (const value of ['2023-02-29', '2024-02-30', '2024-13-01', 'invalid', '']) assert.throws(() => employmentData(form({ ...base, 'start-date': value })))
    assert.throws(() => employmentData(form({ ...base, 'end-date': '2024-02-28' })))
    assert.equal(employmentData(form({ ...base, 'end-date': '2024-02-29' })).endDate, '2024-02-29T00:00:00.000Z')
})
test('missing title, malformed IDs and file inputs are rejected', () => {
    assert.throws(() => employmentData(form({ ...base, 'job-title': ' ' })))
    for (const value of [null, '', '0', '-1', '1.1', '1e2', '9007199254740992']) assert.throws(() => employmentId(value))
    const data = form(base); data.set('notes', new Blob(['x']), 'notes.txt'); assert.throws(() => employmentData(data))
})
