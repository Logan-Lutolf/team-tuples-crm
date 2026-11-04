#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/02a67ceb529292d67a3b62ee0492bca676f4642bdfffd6930837f985bc0e8552/contract';
import startContract from '../../snapshots/02a67ceb529292d67a3b62ee0492bca676f4642bdfffd6930837f985bc0e8552/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/44099428b744912efb3e31788b6f4e70b837626f3dd35a6179f910186e4b9461/contract';
import endContract from '../../snapshots/44099428b744912efb3e31788b6f4e70b837626f3dd35a6179f910186e4b9461/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  rawSql,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      ...this.renameTable({
        schema: 'public',
        table: 'SchoolEmployees',
        to: 'LegacySchoolEmployees',
      }),
      this.createTable({
        schema: 'public',
        table: 'EmployeeAssignment',
        columns: [
          col('branchId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('employeeId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('programId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('region', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'EmployeeAssignment_region_check_de154a3d',
            `"region" IN ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN')`,
          ),
          checkExpression(
            'EmployeeAssignment_role_check_b697a84e',
            `"role" IN ('ADMIN', 'WORKSHOPS_COORDINATOR', 'SCHOOL_NETWORK_COORDINATOR', 'STORIES_OF_OUR_NEIGHBORS_COORDINATOR', 'VETERANS_DAY_COORDINATOR', 'NEWSLETTER_COORDINATOR')`,
          ),
        ],
      }),
      // Copy roles before removing the source column. No branch/program scope was recorded.
      rawSql({
        id: 'backfill.EmployeeAssignment.roles',
        label: 'Preserve existing employee roles as assignments',
        operationClass: 'data',
        target: { id: 'postgres', details: { schema: 'public', objectType: 'table', name: 'EmployeeAssignment' } },
        precheck: [{
          description: 'check for employee roles without a matching assignment',
          sql: `SELECT EXISTS (SELECT 1 FROM public."Employee" e WHERE NOT EXISTS (
            SELECT 1 FROM public."EmployeeAssignment" a WHERE a."employeeId" = e.id
              AND a.role = e.role AND a.region IS NOT DISTINCT FROM e.region
              AND a."branchId" IS NULL AND a."programId" IS NULL)) AS result`,
        }],
        execute: [{
          description: 'copy existing employee roles and regions',
          sql: `INSERT INTO public."EmployeeAssignment" ("employeeId", role, region)
            SELECT e.id, e.role, e.region FROM public."Employee" e WHERE NOT EXISTS (
              SELECT 1 FROM public."EmployeeAssignment" a WHERE a."employeeId" = e.id
                AND a.role = e.role AND a.region IS NOT DISTINCT FROM e.region
                AND a."branchId" IS NULL AND a."programId" IS NULL)`,
        }],
        postcheck: [{
          description: 'verify every employee role was preserved',
          sql: `SELECT NOT EXISTS (SELECT 1 FROM public."Employee" e WHERE NOT EXISTS (
            SELECT 1 FROM public."EmployeeAssignment" a WHERE a."employeeId" = e.id
              AND a.role = e.role AND a.region IS NOT DISTINCT FROM e.region
              AND a."branchId" IS NULL AND a."programId" IS NULL)) AS result`,
        }],
      }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Employee',
        constraint: 'Employee_role_check_b697a84e',
      }),
      this.dropColumn({ schema: 'public', table: 'Employee', column: 'role' }),
      this.createTable({
        schema: 'public',
        table: 'Interaction',
        columns: [
          col('contactId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('contactedAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('employeeId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('mode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('programId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('schoolId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Interaction_mode_check_0a8da420',
            `"mode" IN ('PHONE', 'EMAIL', 'IN_PERSON', 'VIDEO_CALL', 'MESSAGE', 'OTHER')`,
          ),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'Branch',
        column: col('chiefId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Branch',
        column: col('institute', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Participation',
        column: col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      rawSql({
        id: 'backfill.Participation.name',
        label: 'Name existing participations using their stable IDs',
        operationClass: 'data',
        target: { id: 'postgres', details: { schema: 'public', objectType: 'table', name: 'Participation' } },
        precheck: [{ description: 'check for unnamed participations', sql: 'SELECT EXISTS (SELECT 1 FROM public."Participation" WHERE name IS NULL) AS result' }],
        execute: [{ description: 'assign editable historical participation names', sql: `UPDATE public."Participation" SET name = 'Participation #' || id::text WHERE name IS NULL` }],
        postcheck: [{ description: 'verify all participations have names', sql: 'SELECT NOT EXISTS (SELECT 1 FROM public."Participation" WHERE name IS NULL) AS result' }],
      }),
      this.setNotNull({ schema: 'public', table: 'Participation', column: 'name' }),
      this.createIndex({
        schema: 'public',
        table: 'Branch',
        index: 'Branch_chiefId_idx_3a71836f',
        columns: ['chiefId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmployeeAssignment',
        index: 'EmployeeAssignment_branchId_idx_d04da5bb',
        columns: ['branchId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmployeeAssignment',
        index: 'EmployeeAssignment_branchId_programId_idx_2ed2f029',
        columns: ['branchId', 'programId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmployeeAssignment',
        index: 'EmployeeAssignment_employeeId_idx_087dd4a6',
        columns: ['employeeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'EmployeeAssignment',
        index: 'EmployeeAssignment_programId_idx_4e50c706',
        columns: ['programId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Interaction',
        index: 'Interaction_contactId_contactedAt_idx_88d94409',
        columns: ['contactId', 'contactedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Interaction',
        index: 'Interaction_contactId_idx_ec98db2a',
        columns: ['contactId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Interaction',
        index: 'Interaction_employeeId_contactedAt_idx_d693dbbf',
        columns: ['employeeId', 'contactedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Interaction',
        index: 'Interaction_employeeId_idx_087dd4a6',
        columns: ['employeeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Interaction',
        index: 'Interaction_programId_contactedAt_idx_06e95833',
        columns: ['programId', 'contactedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Interaction',
        index: 'Interaction_programId_idx_4e50c706',
        columns: ['programId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Interaction',
        index: 'Interaction_schoolId_contactedAt_idx_b25f69bb',
        columns: ['schoolId', 'contactedAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Interaction',
        index: 'Interaction_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Branch',
        foreignKey: {
          name: 'Branch_chiefId_fkey',
          columns: ['chiefId'],
          references: { schema: 'public', table: 'Employee', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'EmployeeAssignment',
        foreignKey: {
          name: 'EmployeeAssignment_employeeId_fkey',
          columns: ['employeeId'],
          references: { schema: 'public', table: 'Employee', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'EmployeeAssignment',
        foreignKey: {
          name: 'EmployeeAssignment_branchId_fkey',
          columns: ['branchId'],
          references: { schema: 'public', table: 'Branch', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'EmployeeAssignment',
        foreignKey: {
          name: 'EmployeeAssignment_programId_fkey',
          columns: ['programId'],
          references: { schema: 'public', table: 'Program', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Interaction',
        foreignKey: {
          name: 'Interaction_employeeId_fkey',
          columns: ['employeeId'],
          references: { schema: 'public', table: 'Employee', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Interaction',
        foreignKey: {
          name: 'Interaction_contactId_fkey',
          columns: ['contactId'],
          references: { schema: 'public', table: 'Contact', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Interaction',
        foreignKey: {
          name: 'Interaction_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Interaction',
        foreignKey: {
          name: 'Interaction_programId_fkey',
          columns: ['programId'],
          references: { schema: 'public', table: 'Program', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
