#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0ba660f292efbc1e9496ca6e9f86a66e213a490ed57c50474c143b59c373c8a6/contract';
import endContract from '../../snapshots/0ba660f292efbc1e9496ca6e9f86a66e213a490ed57c50474c143b59c373c8a6/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c33b6c3cfbc6a8956ca9fd0513c25f7da116cb9e1df4b4bfae647e6a9621cf74/contract';
import startContract from '../../snapshots/c33b6c3cfbc6a8956ca9fd0513c25f7da116cb9e1df4b4bfae647e6a9621cf74/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'SmartEmailContact',
        columns: [
          col('blacklisted', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('hardBounced', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('listsJson', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('softBounces', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('syncedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'SmartEmailEvent',
        columns: [
          col('campaignName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('campaignType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('detailsJson', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('messageId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('occurredAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('subject', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'SmartEmailSync',
        columns: [
          col('contactOffset', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('contactsStartedAt', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('contactsSyncedAt', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('eventsSyncedAt', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lastAttemptAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('lastError', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('lockToken', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('lockUntil', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('streamId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SmartEmailContact',
        index: 'SmartEmailContact_email_idx_46df9cad',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SmartEmailEvent',
        index: 'SmartEmailEvent_email_messageId_idx_73ce93f2',
        columns: ['email', 'messageId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SmartEmailEvent',
        index: 'SmartEmailEvent_email_type_occurredAt_idx_77c7bb33',
        columns: ['email', 'type', 'occurredAt'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
