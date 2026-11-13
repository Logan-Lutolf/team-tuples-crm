#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/c33b6c3cfbc6a8956ca9fd0513c25f7da116cb9e1df4b4bfae647e6a9621cf74/contract';
import endContract from '../../snapshots/c33b6c3cfbc6a8956ca9fd0513c25f7da116cb9e1df4b4bfae647e6a9621cf74/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/fd3effa7a717c1ed6b07c6f968059575d5aba83b96ea3c511699cd96fc28df6b/contract';
import startContract from '../../snapshots/fd3effa7a717c1ed6b07c6f968059575d5aba83b96ea3c511699cd96fc28df6b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Employee',
        constraint: 'Employee_roles_check_d243e319',
      }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'EmployeeAssignment',
        constraint: 'EmployeeAssignment_role_check_2f516525',
      }),
      this.createTable({
        schema: 'public',
        table: 'EmailSegment',
        columns: [
          col('contactCount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('contactsJson', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('createdById', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('filtersJson', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'TrackedEmail',
        columns: [
          col('contactedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('fingerprint', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('fromEmail', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('matchedContactCount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('receivedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('recipientEmails', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'Contact',
        column: col('lastTrackedEmailAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Employee',
        constraint: 'Employee_roles_check_a37c734c',
        expression: `array_remove("roles", NULL) <@ '{"ADMIN","MARKETER","WORKSHOPS_COORDINATOR","SCHOOL_NETWORK_COORDINATOR","STORIES_OF_OUR_NEIGHBORS_COORDINATOR","VETERANS_DAY_COORDINATOR","NEWSLETTER_COORDINATOR","BRANCH_DIRECTOR","HEAD_OF_EDUCATION","PROJECT_MANAGER","COORDINATOR","DEVELOPMENT_LEAD","PRODUCTION","STUDIO_LEAD","LECTURER","METHODOLOGY_LEAD"}'`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'EmployeeAssignment',
        constraint: 'EmployeeAssignment_role_check_bc2abc23',
        expression: `"role" IN ('ADMIN', 'MARKETER', 'WORKSHOPS_COORDINATOR', 'SCHOOL_NETWORK_COORDINATOR', 'STORIES_OF_OUR_NEIGHBORS_COORDINATOR', 'VETERANS_DAY_COORDINATOR', 'NEWSLETTER_COORDINATOR', 'BRANCH_DIRECTOR', 'HEAD_OF_EDUCATION', 'PROJECT_MANAGER', 'COORDINATOR', 'DEVELOPMENT_LEAD', 'PRODUCTION', 'STUDIO_LEAD', 'LECTURER', 'METHODOLOGY_LEAD')`,
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmailSegment',
        index: 'EmailSegment_createdById_id_idx_2b066c09',
        columns: ['createdById', 'id'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
