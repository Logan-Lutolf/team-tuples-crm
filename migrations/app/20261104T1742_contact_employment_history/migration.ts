#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/44099428b744912efb3e31788b6f4e70b837626f3dd35a6179f910186e4b9461/contract';
import startContract from '../../snapshots/44099428b744912efb3e31788b6f4e70b837626f3dd35a6179f910186e4b9461/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8de3cbed860f8cc01dfd4cc7da4f1901a35677fb0ae0552d138e88de99fbb4dd/contract';
import endContract from '../../snapshots/8de3cbed860f8cc01dfd4cc7da4f1901a35677fb0ae0552d138e88de99fbb4dd/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'EmployeeAssignment',
        constraint: 'EmployeeAssignment_role_check_b697a84e',
      }),
      this.createTable({
        schema: 'public',
        table: 'ContactEmployment',
        columns: [
          col('contactId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('endDate', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jobTitle', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('startDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'EmployeeAssignment',
        constraint: 'EmployeeAssignment_role_check_2f516525',
        expression: `"role" IN ('ADMIN', 'WORKSHOPS_COORDINATOR', 'SCHOOL_NETWORK_COORDINATOR', 'STORIES_OF_OUR_NEIGHBORS_COORDINATOR', 'VETERANS_DAY_COORDINATOR', 'NEWSLETTER_COORDINATOR', 'BRANCH_DIRECTOR', 'HEAD_OF_EDUCATION', 'PROJECT_MANAGER', 'COORDINATOR', 'DEVELOPMENT_LEAD', 'PRODUCTION', 'STUDIO_LEAD', 'LECTURER', 'METHODOLOGY_LEAD')`,
      }),
      this.createIndex({
        schema: 'public',
        table: 'ContactEmployment',
        index: 'ContactEmployment_contactId_idx_ec98db2a',
        columns: ['contactId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ContactEmployment',
        index: 'ContactEmployment_contactId_startDate_idx_498892b0',
        columns: ['contactId', 'startDate'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ContactEmployment',
        index: 'ContactEmployment_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ContactEmployment',
        foreignKey: {
          name: 'ContactEmployment_contactId_fkey',
          columns: ['contactId'],
          references: { schema: 'public', table: 'Contact', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ContactEmployment',
        foreignKey: {
          name: 'ContactEmployment_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
