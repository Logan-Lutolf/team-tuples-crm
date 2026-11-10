#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/efffa3f8d1f973b78b7dc3e6dd41b3896a4fc50dd12e45a138b789f646cdeedc/contract';
import startContract from '../../snapshots/efffa3f8d1f973b78b7dc3e6dd41b3896a4fc50dd12e45a138b789f646cdeedc/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f4ff1b3a161df37a206e2747f73df3952de4bfcf756be096a0c40181fe448b99/contract';
import endContract from '../../snapshots/f4ff1b3a161df37a206e2747f73df3952de4bfcf756be096a0c40181fe448b99/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, rawSql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      // Temporary nullability supports backfilling existing employees.
      this.addColumn({ schema: 'public', table: 'Employee', column: col('password', 'text', { codecRef: { codecId: 'pg/text@1' } }) }),
      this.addColumn({ schema: 'public', table: 'Employee', column: col('roles', 'text[]', { codecRef: { codecId: 'pg/text@1' } }) }),
      rawSql({
        id: 'backfill.Employee.password',
        label: 'Assign unique setup-required credential hashes to existing employees',
        operationClass: 'data',
        target: { id: 'postgres', details: { schema: 'public', objectType: 'table', name: 'Employee' } },
        precheck: [{ description: 'check for missing credential hashes', sql: 'SELECT EXISTS (SELECT 1 FROM public."Employee" WHERE password IS NULL) AS result' }],
        execute: [{
          description: 'hash discarded high-entropy random secrets; never create default passwords',
          // Two independent random UUIDs supply ~244 bits of randomness per row.
          // These are setup-required markers, NOT hashes of human-chosen passwords.
          // SHA-256 is appropriate for these unguessable random secrets, not for
          // normal passwords, which must use a password KDF such as Argon2id.
          // No secrets/hashes are generated during emit or written to artifacts.
          sql: `UPDATE public."Employee"
            SET password = '!setup-required$sha256$' || encode(sha256(convert_to(
              gen_random_uuid()::text || gen_random_uuid()::text, 'UTF8')), 'hex')
            WHERE password IS NULL`,
        }],
        postcheck: [{ description: 'verify every employee has a credential value', sql: 'SELECT NOT EXISTS (SELECT 1 FROM public."Employee" WHERE password IS NULL) AS result' }],
      }),
      rawSql({
        id: 'backfill.Employee.roles',
        label: 'Copy only unscoped assignment roles into Employee.roles',
        operationClass: 'data',
        target: { id: 'postgres', details: { schema: 'public', objectType: 'table', name: 'Employee' } },
        precheck: [{ description: 'check for missing role arrays', sql: 'SELECT EXISTS (SELECT 1 FROM public."Employee" WHERE roles IS NULL) AS result' }],
        execute: [{
          description: 'copy distinct global roles; preserve every existing assignment',
          sql: `UPDATE public."Employee" e SET roles = ARRAY(
            SELECT DISTINCT a.role FROM public."EmployeeAssignment" a
            WHERE a."employeeId" = e.id AND a."branchId" IS NULL
              AND a."programId" IS NULL AND a.region IS NULL
            ORDER BY a.role
          ) WHERE e.roles IS NULL`,
        }],
        postcheck: [{ description: 'verify every employee has a role array', sql: 'SELECT NOT EXISTS (SELECT 1 FROM public."Employee" WHERE roles IS NULL) AS result' }],
      }),
      // Finish with the exact required fields in the unchanged contract.
      this.setNotNull({ schema: 'public', table: 'Employee', column: 'password' }),
      this.setNotNull({ schema: 'public', table: 'Employee', column: 'roles' }),
      ...endContract.storage.namespaces.public.entries.table.Employee.checks
        .filter(check => check.name.startsWith('Employee_roles_'))
        .map(check => this.addCheckConstraint({ schema: 'public', table: 'Employee', constraint: check.name, expression: check.expression })),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
