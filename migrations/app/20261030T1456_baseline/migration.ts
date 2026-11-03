#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/fd110db52d3709a08f72a58242b1e0cb968cfff46a57823c333625af66e874db/contract';
import endContract from '../../snapshots/fd110db52d3709a08f72a58242b1e0cb968cfff46a57823c333625af66e874db/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'Branch',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('region', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Branch_name_check_ca88058c',
            "\"name\" IN ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT')",
          ),
          checkExpression(
            'Branch_region_check_de154a3d',
            "\"region\" IN ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Contact',
        columns: [
          col('address', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('branchId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('branchRole', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('last_contacted', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('last_contacted_byId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('region', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('schoolId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('subject', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Contact_region_check_de154a3d',
            "\"region\" IN ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Employee',
        columns: [
          col('address', 'jsonb', { codecRef: { codecId: 'pg/jsonb@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('is_online', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('region', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Employee_region_check_de154a3d',
            "\"region\" IN ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN')",
          ),
          checkExpression(
            'Employee_role_check_b697a84e',
            "\"role\" IN ('ADMIN', 'WORKSHOPS_COORDINATOR', 'SCHOOL_NETWORK_COORDINATOR', 'STORIES_OF_OUR_NEIGHBORS_COORDINATOR', 'VETERANS_DAY_COORDINATOR', 'NEWSLETTER_COORDINATOR')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Municipality',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('mayor', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'MunicipalityPrograms',
        columns: [
          col('municipalityId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('programId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['municipalityId', 'programId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Participation',
        columns: [
          col('endDate', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('programId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('startDate', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', {
            notNull: true,
            default: lit('PLANNED'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Participation_status_check_07ec6707',
            "\"status\" IN ('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'ParticipationEmployees',
        columns: [
          col('employeeId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('participationId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['participationId', 'employeeId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Program',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('description', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'School',
        columns: [
          col('address', 'jsonb', { notNull: true, codecRef: { codecId: 'pg/jsonb@1' } }),
          col('branchId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('region', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('relationship', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'School_region_check_de154a3d',
            "\"region\" IN ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN')",
          ),
          checkExpression(
            'School_relationship_check_15167c09',
            "\"relationship\" IN ('POOR', 'AVERAGE', 'EXCELLENT')",
          ),
          checkExpression(
            'School_type_check_b97fb405',
            "\"type\" IN ('PRIMARY', 'SECONDARY', 'UNDERGRADUATE', 'GRADUATE', 'POSTGRADUATE')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'SchoolEmployees',
        columns: [
          col('employeeId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('schoolId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['schoolId', 'employeeId'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Contact',
        constraint: 'Contact_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Employee',
        constraint: 'Employee_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'School',
        constraint: 'School_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Contact',
        index: 'Contact_branchId_idx_d04da5bb',
        columns: ['branchId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Contact',
        index: 'Contact_last_contacted_byId_idx_ee2c3f80',
        columns: ['last_contacted_byId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Contact',
        index: 'Contact_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'MunicipalityPrograms',
        index: 'MunicipalityPrograms_municipalityId_idx_0a7c35cd',
        columns: ['municipalityId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'MunicipalityPrograms',
        index: 'MunicipalityPrograms_programId_idx_4e50c706',
        columns: ['programId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Participation',
        index: 'Participation_programId_idx_4e50c706',
        columns: ['programId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Participation',
        index: 'Participation_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ParticipationEmployees',
        index: 'ParticipationEmployees_employeeId_idx_087dd4a6',
        columns: ['employeeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ParticipationEmployees',
        index: 'ParticipationEmployees_participationId_idx_1840362d',
        columns: ['participationId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'School',
        index: 'School_branchId_idx_d04da5bb',
        columns: ['branchId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SchoolEmployees',
        index: 'SchoolEmployees_employeeId_idx_087dd4a6',
        columns: ['employeeId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'SchoolEmployees',
        index: 'SchoolEmployees_schoolId_idx_82b454d7',
        columns: ['schoolId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Contact',
        foreignKey: {
          name: 'Contact_last_contacted_byId_fkey',
          columns: ['last_contacted_byId'],
          references: { schema: 'public', table: 'Employee', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Contact',
        foreignKey: {
          name: 'Contact_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Contact',
        foreignKey: {
          name: 'Contact_branchId_fkey',
          columns: ['branchId'],
          references: { schema: 'public', table: 'Branch', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'MunicipalityPrograms',
        foreignKey: {
          name: 'MunicipalityPrograms_programId_fkey',
          columns: ['programId'],
          references: { schema: 'public', table: 'Program', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'MunicipalityPrograms',
        foreignKey: {
          name: 'MunicipalityPrograms_municipalityId_fkey',
          columns: ['municipalityId'],
          references: { schema: 'public', table: 'Municipality', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Participation',
        foreignKey: {
          name: 'Participation_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Participation',
        foreignKey: {
          name: 'Participation_programId_fkey',
          columns: ['programId'],
          references: { schema: 'public', table: 'Program', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ParticipationEmployees',
        foreignKey: {
          name: 'ParticipationEmployees_participationId_fkey',
          columns: ['participationId'],
          references: { schema: 'public', table: 'Participation', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ParticipationEmployees',
        foreignKey: {
          name: 'ParticipationEmployees_employeeId_fkey',
          columns: ['employeeId'],
          references: { schema: 'public', table: 'Employee', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'School',
        foreignKey: {
          name: 'School_branchId_fkey',
          columns: ['branchId'],
          references: { schema: 'public', table: 'Branch', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SchoolEmployees',
        foreignKey: {
          name: 'SchoolEmployees_schoolId_fkey',
          columns: ['schoolId'],
          references: { schema: 'public', table: 'School', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'SchoolEmployees',
        foreignKey: {
          name: 'SchoolEmployees_employeeId_fkey',
          columns: ['employeeId'],
          references: { schema: 'public', table: 'Employee', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
