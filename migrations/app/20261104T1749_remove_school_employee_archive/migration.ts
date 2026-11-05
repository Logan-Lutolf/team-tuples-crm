#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/8de3cbed860f8cc01dfd4cc7da4f1901a35677fb0ae0552d138e88de99fbb4dd/contract';
import startContract from '../../snapshots/8de3cbed860f8cc01dfd4cc7da4f1901a35677fb0ae0552d138e88de99fbb4dd/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a72238c8455d7499071aa2f011247637b15d51a96e1c79c50b9127595a12255f/contract';
import endContract from '../../snapshots/a72238c8455d7499071aa2f011247637b15d51a96e1c79c50b9127595a12255f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [this.dropTable({ schema: 'public', table: 'LegacySchoolEmployees' })];
  }
}

MigrationCLI.run(import.meta.url, M);
