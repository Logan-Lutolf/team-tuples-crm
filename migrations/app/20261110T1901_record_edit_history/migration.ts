#!/usr/bin/env -S node
import { readFileSync } from 'node:fs';
import type { Contract as Start } from '../../snapshots/7df83bf378c9e77aa7a1288e9351e396beefb8f71c77c6d7e0273b03e96631d6/contract';
import startContract from '../../snapshots/7df83bf378c9e77aa7a1288e9351e396beefb8f71c77c6d7e0273b03e96631d6/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ac81dd0dae31a533ee8df7caa846142684babaefe97197cbe08ad27b1edd8505/contract';
import endContract from '../../snapshots/ac81dd0dae31a533ee8df7caa846142684babaefe97197cbe08ad27b1edd8505/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, rawSql, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'EditHistory',
        columns: [
          col('actorId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('actorName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('afterData', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('beforeData', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('changedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('operation', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('recordId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('recordType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sourceTable', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EditHistory',
        index: 'EditHistory_recordType_recordId_id_idx_2eb894eb',
        columns: ['recordType', 'recordId', 'id'],
      }),
      rawSql({
        id: 'audit.install-record-history',
        label: 'Install transactional edit-history triggers for search records and relationships',
        operationClass: 'additive',
        target: { id: 'postgres', details: { schema: 'public', objectType: 'table', name: 'EditHistory' } },
        precheck: [{ description: 'History triggers are not installed', sql: "SELECT to_regprocedure('public.crm_capture_edit_history()') IS NULL AS result" }],
        execute: [{ description: 'Create history function and triggers', sql: readFileSync(new URL('./audit.sql', import.meta.url), 'utf8') }],
        postcheck: [{ description: 'All history triggers are installed', sql: "SELECT count(*) = 13 AS result FROM pg_trigger WHERE tgname = 'crm_edit_history' AND tgfoid = to_regprocedure('public.crm_capture_edit_history()')" }],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
