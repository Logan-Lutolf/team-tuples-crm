#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/a360ae11609df68776e86a102641b08a7fe2880c62236e6e4044e9eddace1253/contract';
import endContract from '../../snapshots/a360ae11609df68776e86a102641b08a7fe2880c62236e6e4044e9eddace1253/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/a72238c8455d7499071aa2f011247637b15d51a96e1c79c50b9127595a12255f/contract';
import startContract from '../../snapshots/a72238c8455d7499071aa2f011247637b15d51a96e1c79c50b9127595a12255f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'ParticipationContacts',
        columns: [
          col('contactId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('participationId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['participationId', 'contactId'])],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ParticipationContacts',
        index: 'ParticipationContacts_contactId_idx_ec98db2a',
        columns: ['contactId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ParticipationContacts',
        index: 'ParticipationContacts_participationId_idx_1840362d',
        columns: ['participationId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ParticipationContacts',
        foreignKey: {
          name: 'ParticipationContacts_participationId_fkey',
          columns: ['participationId'],
          references: { schema: 'public', table: 'Participation', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ParticipationContacts',
        foreignKey: {
          name: 'ParticipationContacts_contactId_fkey',
          columns: ['contactId'],
          references: { schema: 'public', table: 'Contact', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
