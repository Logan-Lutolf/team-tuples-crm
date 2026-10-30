#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/02a67ceb529292d67a3b62ee0492bca676f4642bdfffd6930837f985bc0e8552/contract';
import endContract from '../../snapshots/02a67ceb529292d67a3b62ee0492bca676f4642bdfffd6930837f985bc0e8552/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/2d51f8b9f0faa8fb58a3d435ad4aab0c3c6ee12196945bac602238be90a41fda/contract';
import startContract from '../../snapshots/2d51f8b9f0faa8fb58a3d435ad4aab0c3c6ee12196945bac602238be90a41fda/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn } from '@prisma/orm-postgres/migration';

import postgres from '@prisma/orm-postgres/runtime';

const { sql: db, contract } = postgres<End>({ contractJson: endContract });

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('createdAt', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'School',
        column: col('updatedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.dataTransform(contract, 'backfill-School-updatedAt', {
        check: () => db.public.School.select('id').where((f, fns) => fns.eq(f.updatedAt, null)).limit(1),
        // Historical edit times were not recorded; existing schools start at migration time.
        run: () => db.public.School.update({ updatedAt: new Date().toISOString() }).where((f, fns) => fns.eq(f.updatedAt, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'School', column: 'updatedAt' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
