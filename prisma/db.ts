import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

const url = process.env['DATABASE_URL'];
if (!url) {
  throw new Error('DATABASE_URL must be set to connect to Postgres.');
}

export const db = postgres<Contract>({
  contractJson,
  url,
});

// Wait for the driver before importing modules can issue their first query.
await db.connect();
