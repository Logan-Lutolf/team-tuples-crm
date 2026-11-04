import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

const url = process.env['DATABASE_URL'];
if (!url) throw new Error('DATABASE_URL must be set to connect to Postgres.');

function createClient() {
  return postgres<Contract>({
    contractJson,
    url: url!,
    poolOptions: {
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 300_000,
    },
  });
}

type Client = ReturnType<typeof createClient>;
const globalDb = globalThis as typeof globalThis & {
  crmDatabase?: { key: string; client: Client; ready: Promise<unknown> };
};
// Next's development module reloads must reuse the same pool. Regenerated
// contracts and connection changes still get a fresh, matching client.
const key = JSON.stringify([url, contractJson]);
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
