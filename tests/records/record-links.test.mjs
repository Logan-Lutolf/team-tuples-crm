import { test } from 'node:test'
import assert from 'node:assert/strict'
import { recordTypes, recordHref, isRecordType } from '../../lib/record-links.ts'

test('all six dashboard record types have distinct detail URLs', () => {
    const urls = recordTypes.map(type => recordHref(type, 42))
    assert.equal(new Set(urls).size, 6)
    assert.deepEqual(urls, ['/details/schools/42', '/details/contacts/42', '/details/employees/42', '/details/programs/42', '/details/branches/42', '/details/municipalities/42'])
})
test('unknown entity types and invalid record IDs are rejected', () => {
    for (const type of ['unknown', '../schools', 'employee-management', '']) assert.equal(isRecordType(type), false)
    for (const type of recordTypes) assert.equal(isRecordType(type), true)
    for (const id of [0, -1, 1.2, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => recordHref('contacts', id))
})
