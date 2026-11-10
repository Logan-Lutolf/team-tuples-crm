#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/7df83bf378c9e77aa7a1288e9351e396beefb8f71c77c6d7e0273b03e96631d6/contract';
import endContract from '../../snapshots/7df83bf378c9e77aa7a1288e9351e396beefb8f71c77c6d7e0273b03e96631d6/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f4ff1b3a161df37a206e2747f73df3952de4bfcf756be096a0c40181fe448b99/contract';
import startContract from '../../snapshots/f4ff1b3a161df37a206e2747f73df3952de4bfcf756be096a0c40181fe448b99/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Employee',
        column: col('pfpImgUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
