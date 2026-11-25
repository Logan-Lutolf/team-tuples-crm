import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import { AuditPool } from '../lib/audit-pool.mjs';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

const url = process.env['DATABASE_URL'];
if (!url) throw new Error('DATABASE_URL must be set to connect to Postgres.');

function createClient() {
  const pool = new AuditPool({
    connectionString: url,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 300_000,
  }, async () => {
    // The same client is used by maintenance scripts outside Next.js.
    if (process.env.NEXT_RUNTIME !== 'nodejs') return null;
    const { getAuditEditorId } = await import('../lib/audit-editor');
    return getAuditEditorId();
  });
  pool.on('error', error => console.error('Idle database connection failed', error));
  const client = postgres<Contract>({ contractJson, pg: pool });
  const close = client.close.bind(client);
  let closing: Promise<void> | undefined;
  client.close = () => closing ??= close().finally(() => pool.end());
  return client;
}

type Client = ReturnType<typeof createClient>;
const globalDb = globalThis as typeof globalThis & {
  crmDatabase?: { key: string; client: Client; ready: Promise<unknown> };
};
// Next's development module reloads must reuse the same pool. Regenerated
// contracts and connection changes still get a fresh, matching client.
const key = JSON.stringify([url, contractJson, AuditPool.toString()]);
let state = process.env.NODE_ENV !== 'production' ? globalDb.crmDatabase : undefined;
if (!state || state.key !== key) {
  const client = createClient();
  state = { key, client, ready: client.connect() };
  if (process.env.NODE_ENV !== 'production') {
    const previous = globalDb.crmDatabase;
    globalDb.crmDatabase = state;
    if (previous) void previous.client.close().catch(() => {});
  }
}
export const db = state.client;
await state.ready;
