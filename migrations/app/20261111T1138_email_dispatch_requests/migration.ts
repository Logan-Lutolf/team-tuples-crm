#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/ac81dd0dae31a533ee8df7caa846142684babaefe97197cbe08ad27b1edd8505/contract';
import startContract from '../../snapshots/ac81dd0dae31a533ee8df7caa846142684babaefe97197cbe08ad27b1edd8505/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/fd3effa7a717c1ed6b07c6f968059575d5aba83b96ea3c511699cd96fc28df6b/contract';
import endContract from '../../snapshots/fd3effa7a717c1ed6b07c6f968059575d5aba83b96ea3c511699cd96fc28df6b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'EmailDispatch',
        columns: [
          col('actorId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('fingerprint', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('providerEmailId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('providerResult', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('recipientCount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('state', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmailDispatch',
        index: 'EmailDispatch_actorId_createdAt_idx_0e9f1adf',
        columns: ['actorId', 'createdAt'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
