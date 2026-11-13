import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

function run(mock) {
    return spawnSync(process.execPath, ['--input-type=module', '-e', `
        process.env.SMARTEMAILING_SYNC_URL='https://crm.example.test/api/smartemailing/sync';
        process.env.SMARTEMAILING_SYNC_SECRET='test-only-secret-that-is-long-enough';
        ${mock}
        await import('./scripts/sync-smartemailing.mjs');
    `], { encoding: 'utf8', timeout: 10000 });
}
test('scheduler continues until contact/event backlogs are drained', () => {
    const result = run(`let calls=0;
        globalThis.fetch=async(url,options)=>{
            if(String(url)!=='https://crm.example.test/api/smartemailing/sync'||options.method!=='POST'||!options.headers.Authorization)throw Error('Bad request');
            return Response.json({more:++calls<2,contactsRead:3,eventsRead:4});
        };`);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.match(/Imported/g).length, 2);
});
test('scheduler fails visibly on a busy job or HTTP error and never logs secrets', () => {
    for (const response of ['Response.json({busy:true,more:true})', "new Response('sensitive provider response',{status:502})"]) {
        const result = run(`globalThis.fetch=async()=>${response};`);
        assert.equal(result.status, 1);
        assert.doesNotMatch(result.stderr, /test-only-secret|sensitive provider/);
    }
});
