#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2d51f8b9f0faa8fb58a3d435ad4aab0c3c6ee12196945bac602238be90a41fda/contract';
import endContract from '../../snapshots/2d51f8b9f0faa8fb58a3d435ad4aab0c3c6ee12196945bac602238be90a41fda/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fd110db52d3709a08f72a58242b1e0cb968cfff46a57823c333625af66e874db/contract';
import startContract from '../../snapshots/fd110db52d3709a08f72a58242b1e0cb968cfff46a57823c333625af66e874db/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';
import postgres from '@prisma/orm-postgres/runtime';

const { sql: db, contract } = postgres<End>({ contractJson: endContract });

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'Contact', column: 'branchRole' }),
      this.dropColumn({ schema: 'public', table: 'Contact', column: 'subject' }),
      this.addColumn({
        schema: 'public',
        table: 'Contact',
        column: col('contactRole', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(contract, 'backfill-Contact-contactRole', {
        check: () => db.public.Contact.select('id').where((f, fns) => fns.eq(f.contactRole, null)).limit(1),
        run: () => db.public.Contact.update({ contactRole: 'OTHER' }).where((f, fns) => fns.eq(f.contactRole, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'Contact', column: 'contactRole' }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Contact',
        constraint: 'Contact_contactRole_check_f2942349',
        expression:
          "\"contactRole\" IN ('TEACHER', 'PRINCIPAL', 'SCHOOL_COORDINATOR', 'STUDENT', 'HISTORIAN', 'GOVERNMENT_OFFICIAL', 'DONOR', 'SPONSOR', 'PARTNER', 'VOLUNTEER', 'OTHER')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
