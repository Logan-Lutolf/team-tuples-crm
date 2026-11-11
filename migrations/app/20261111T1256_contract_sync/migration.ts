#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/979948870a200e311a51339bb708e6151c840bede61d7edf522b5ccf900c48b9/contract';
import endContract from '../../snapshots/979948870a200e311a51339bb708e6151c840bede61d7edf522b5ccf900c48b9/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f4ff1b3a161df37a206e2747f73df3952de4bfcf756be096a0c40181fe448b99/contract';
import startContract from '../../snapshots/f4ff1b3a161df37a206e2747f73df3952de4bfcf756be096a0c40181fe448b99/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Employee',
        column: col('mustChangePassword', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Employee',
        column: col('pfpImgUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
