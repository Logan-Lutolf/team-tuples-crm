import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

// Load the server helper with a fake database; exercise the actual authorization logic.
const source = (await readFile(new URL('../../lib/branch-edit-access.ts', import.meta.url), 'utf8'))
    .replace("import 'server-only'", '')
    .replace("import { db } from '@/prisma/db'", 'const db = {} as any')
    .replace("'./branch-edit-policy'", JSON.stringify(new URL('../../lib/branch-edit-policy.ts', import.meta.url).href))
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { branchEditScope, authorizeBranchEdit } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

function client({ member = false, contactBranch = 3, schoolBranch = 3 } = {}) {
    const table = rows => ({ where: () => table(rows), select: () => table(rows), forUpdate: () => table(rows), first: async () => rows[0], all: () => ({ toArray: async () => rows }) })
    return { orm: { public: {
        Employee: table([{ id: 18 }]), Branch: table([{ id: 3 }]),
        EmployeeAssignment: table(member ? [{ branchId: 3 }] : []),
        Contact: table([{ branchId: contactBranch }]), School: table([{ branchId: schoolBranch }]),
    } } }
}
test('Eva and branch assignees are scoped; unrelated employees retain existing access', async () => {
    assert.deepEqual(await branchEditScope({ id: 18, roles: [] }, client()), { restricted: true, branchIds: [3] })
    assert.deepEqual(await branchEditScope({ id: 22, roles: [] }, client({ member: true })), { restricted: true, branchIds: [3] })
    assert.deepEqual(await branchEditScope({ id: 1, roles: ['ADMIN'] }, client()), { restricted: false, branchIds: [] })
    assert.deepEqual(await branchEditScope(null, client()), { restricted: true, branchIds: [] })
})
test('server checks persisted branch ownership for both record types', async () => {
    const scope = { restricted: true, branchIds: [3] }
    for (const type of ['Contact', 'School']) {
        await authorizeBranchEdit(client(), scope, { type, id: 1, destinationBranchId: 3 })
        await assert.rejects(authorizeBranchEdit(client({ contactBranch: 1, schoolBranch: 1 }), scope, { type, id: 1, destinationBranchId: 3 }))
        await assert.rejects(authorizeBranchEdit(client(), scope, { type, id: 1, destinationBranchId: 1 }))
    }
    await assert.rejects(authorizeBranchEdit(client(), scope))
    await assert.rejects(authorizeBranchEdit(client({ schoolBranch: 1 }), scope, { type: 'Contact', id: 1, schoolId: 2 }))
})
