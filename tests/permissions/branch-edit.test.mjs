import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canEditBranchRecord, assertBranchEdit, BranchEditPermissionError } from '../../lib/branch-edit-policy.ts'

const eva = { restricted: true, branchIds: [3] }
test('branch employees can edit their own branch records', () => {
    assert.equal(canEditBranchRecord(eva, 3), true)
    assert.doesNotThrow(() => assertBranchEdit(eva, [3, 3]))
})
test('other branches and unassigned records cannot be edited', () => {
    for (const branchId of [1, 2, null]) {
        assert.equal(canEditBranchRecord(eva, branchId), false)
        assert.throws(() => assertBranchEdit(eva, [branchId]), BranchEditPermissionError)
    }
})
test('cannot move a record into or out of the permitted branch', () => {
    for (const branches of [[3, 1], [1, 3], [3, null]]) {
        assert.throws(() => assertBranchEdit(eva, branches), BranchEditPermissionError)
    }
})
test('unscoped mutations and unsigned users are denied', () => {
    assert.throws(() => assertBranchEdit(eva, []), BranchEditPermissionError)
    assert.throws(() => assertBranchEdit({ restricted: true, branchIds: [] }, [3]), BranchEditPermissionError)
})
test('employees outside Eva’s branch keep their existing behavior', () => {
    const scope = { restricted: false, branchIds: [] }
    for (const branches of [[], [null], [1, 3]]) assert.doesNotThrow(() => assertBranchEdit(scope, branches))
})
