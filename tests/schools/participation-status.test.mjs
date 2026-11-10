import { test } from 'node:test'
import assert from 'node:assert/strict'
import { participationStatus, datedParticipations } from '../../lib/participation-status.ts'

const participation = { startDate: '2026-11-05T10:00:00Z', endDate: '2026-11-05T11:00:00Z', status: 'ONGOING' }

test('status follows start and end boundaries regardless of saved lifecycle status', () => {
    for (const status of ['PLANNED', 'ONGOING', 'COMPLETED']) {
        const record = { ...participation, status }
        assert.equal(participationStatus(record, Date.parse('2026-11-05T09:59:59Z')), 'PLANNED')
        assert.equal(participationStatus(record, Date.parse('2026-11-05T10:00:00Z')), 'ONGOING')
        assert.equal(participationStatus(record, Date.parse('2026-11-05T10:59:59Z')), 'ONGOING')
        assert.equal(participationStatus(record, Date.parse('2026-11-05T11:00:00Z')), 'COMPLETED')
    }
})
test('cancellation is preserved and no end date stays ongoing after the start', () => {
    assert.equal(participationStatus({ ...participation, status: 'CANCELLED' }, Date.parse('2026-12-01T00:00:00Z')), 'CANCELLED')
    assert.equal(participationStatus({ ...participation, endDate: null }, Date.parse('2026-12-01T00:00:00Z')), 'ONGOING')
})
test('equivalent timezone offsets produce the same lifecycle status', () => {
    assert.equal(participationStatus({ ...participation, startDate: '2026-11-05T11:00:00+01:00' }, Date.parse('2026-11-05T10:00:00Z')), 'ONGOING')
})
test('newest start first with deterministic ID tie-break, without modifying input', () => {
    const records = [{ ...participation, id: 1 }, { ...participation, id: 2, startDate: '2026-11-09T10:00:00Z', endDate: null }, { ...participation, id: 3 }]
    const result = datedParticipations(records, Date.parse('2026-11-06T00:00:00Z'))
    assert.deepEqual(result.map(p => p.id), [2, 3, 1])
    assert.deepEqual(result.map(p => p.status), ['PLANNED', 'COMPLETED', 'COMPLETED'])
    assert.deepEqual(records.map(p => p.id), [1, 2, 3])
    assert.equal(records[0].status, 'ONGOING')
})
