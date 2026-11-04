import { strict as assert } from "node:assert"
import { test } from "node:test"
import { branchData, positiveId } from "./branch-data.ts"

function form(values) {
    const result = new FormData()
    for (const [key, value] of Object.entries(values)) result.set(key, value)
    return result
}

test("branch data validates enum values and normalizes optional fields", () => {
    assert.deepEqual(branchData(form({ name: "ONE", region: "THREE", institute: "  Prague  ", chiefId: "12" }), ["ONE"], ["THREE"]), {
        name: "ONE", region: "THREE", institute: "Prague", chiefId: 12,
    })
    assert.deepEqual(branchData(form({ name: "ONE", region: "THREE", institute: "  ", chiefId: "" }), ["ONE"], ["THREE"]), {
        name: "ONE", region: "THREE", institute: null, chiefId: null,
    })
})

test("branch data rejects missing or forged choices and invalid chiefs", () => {
    for (const values of [
        { name: "", region: "THREE" },
        { name: "forged", region: "THREE" },
        { name: "ONE", region: "forged" },
        { name: "ONE", region: "THREE", chiefId: "-1" },
    ]) assert.throws(() => branchData(form(values), ["ONE"], ["THREE"]))
    const upload = form({ name: "ONE", region: "THREE" })
    upload.set("institute", new Blob(["test"]), "test.txt")
    assert.throws(() => branchData(upload, ["ONE"], ["THREE"]))
})

test("record IDs reject absent, fractional, zero, and unsafe inputs", () => {
    for (const value of [null, "", "0", "-1", "1.5", "1e2", "9007199254740992", "text"]) {
        assert.throws(() => positiveId(value, "branch"))
    }
    assert.equal(positiveId("42", "branch"), 42)
})
