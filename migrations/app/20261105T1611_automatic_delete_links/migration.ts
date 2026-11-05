#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/a360ae11609df68776e86a102641b08a7fe2880c62236e6e4044e9eddace1253/contract';
import startContract from '../../snapshots/a360ae11609df68776e86a102641b08a7fe2880c62236e6e4044e9eddace1253/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/efffa3f8d1f973b78b7dc3e6dd41b3896a4fc50dd12e45a138b789f646cdeedc/contract';
import endContract from '../../snapshots/efffa3f8d1f973b78b7dc3e6dd41b3896a4fc50dd12e45a138b789f646cdeedc/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropNotNull({"schema":"public","table":"Contact","column":"branchId"}),
      this.dropNotNull({"schema":"public","table":"ContactEmployment","column":"schoolId"}),
      this.dropNotNull({"schema":"public","table":"Interaction","column":"contactId"}),
      this.dropNotNull({"schema":"public","table":"Interaction","column":"employeeId"}),
      this.dropNotNull({"schema":"public","table":"Participation","column":"programId"}),
      this.dropNotNull({"schema":"public","table":"Participation","column":"schoolId"}),
      this.dropNotNull({"schema":"public","table":"School","column":"branchId"}),
      this.dropConstraint({"schema":"public","table":"Branch","constraint":"Branch_chiefId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"Branch","foreignKey":{"name":"Branch_chiefId_fkey","columns":["chiefId"],"references":{"schema":"public","table":"Employee","columns":["id"]},"onDelete":"setNull"}}),
      this.dropConstraint({"schema":"public","table":"Contact","constraint":"Contact_last_contacted_byId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"Contact","foreignKey":{"name":"Contact_last_contacted_byId_fkey","columns":["last_contacted_byId"],"references":{"schema":"public","table":"Employee","columns":["id"]},"onDelete":"setNull"}}),
      this.dropConstraint({"schema":"public","table":"Contact","constraint":"Contact_schoolId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"Contact","foreignKey":{"name":"Contact_schoolId_fkey","columns":["schoolId"],"references":{"schema":"public","table":"School","columns":["id"]},"onDelete":"setNull"}}),
      this.dropConstraint({"schema":"public","table":"Contact","constraint":"Contact_branchId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"Contact","foreignKey":{"name":"Contact_branchId_fkey","columns":["branchId"],"references":{"schema":"public","table":"Branch","columns":["id"]},"onDelete":"setNull"}}),
      this.dropConstraint({"schema":"public","table":"ContactEmployment","constraint":"ContactEmployment_contactId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"ContactEmployment","foreignKey":{"name":"ContactEmployment_contactId_fkey","columns":["contactId"],"references":{"schema":"public","table":"Contact","columns":["id"]},"onDelete":"cascade"}}),
      this.dropConstraint({"schema":"public","table":"ContactEmployment","constraint":"ContactEmployment_schoolId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"ContactEmployment","foreignKey":{"name":"ContactEmployment_schoolId_fkey","columns":["schoolId"],"references":{"schema":"public","table":"School","columns":["id"]},"onDelete":"setNull"}}),
      this.dropConstraint({"schema":"public","table":"EmployeeAssignment","constraint":"EmployeeAssignment_employeeId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"EmployeeAssignment","foreignKey":{"name":"EmployeeAssignment_employeeId_fkey","columns":["employeeId"],"references":{"schema":"public","table":"Employee","columns":["id"]},"onDelete":"cascade"}}),
      this.dropConstraint({"schema":"public","table":"EmployeeAssignment","constraint":"EmployeeAssignment_branchId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"EmployeeAssignment","foreignKey":{"name":"EmployeeAssignment_branchId_fkey","columns":["branchId"],"references":{"schema":"public","table":"Branch","columns":["id"]},"onDelete":"cascade"}}),
      this.dropConstraint({"schema":"public","table":"EmployeeAssignment","constraint":"EmployeeAssignment_programId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"EmployeeAssignment","foreignKey":{"name":"EmployeeAssignment_programId_fkey","columns":["programId"],"references":{"schema":"public","table":"Program","columns":["id"]},"onDelete":"cascade"}}),
      this.dropConstraint({"schema":"public","table":"Interaction","constraint":"Interaction_employeeId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"Interaction","foreignKey":{"name":"Interaction_employeeId_fkey","columns":["employeeId"],"references":{"schema":"public","table":"Employee","columns":["id"]},"onDelete":"setNull"}}),
      this.dropConstraint({"schema":"public","table":"Interaction","constraint":"Interaction_contactId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"Interaction","foreignKey":{"name":"Interaction_contactId_fkey","columns":["contactId"],"references":{"schema":"public","table":"Contact","columns":["id"]},"onDelete":"setNull"}}),
      this.dropConstraint({"schema":"public","table":"Interaction","constraint":"Interaction_schoolId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"Interaction","foreignKey":{"name":"Interaction_schoolId_fkey","columns":["schoolId"],"references":{"schema":"public","table":"School","columns":["id"]},"onDelete":"setNull"}}),
      this.dropConstraint({"schema":"public","table":"Interaction","constraint":"Interaction_programId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"Interaction","foreignKey":{"name":"Interaction_programId_fkey","columns":["programId"],"references":{"schema":"public","table":"Program","columns":["id"]},"onDelete":"setNull"}}),
      this.dropConstraint({"schema":"public","table":"MunicipalityPrograms","constraint":"MunicipalityPrograms_programId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"MunicipalityPrograms","foreignKey":{"name":"MunicipalityPrograms_programId_fkey","columns":["programId"],"references":{"schema":"public","table":"Program","columns":["id"]},"onDelete":"cascade"}}),
      this.dropConstraint({"schema":"public","table":"MunicipalityPrograms","constraint":"MunicipalityPrograms_municipalityId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"MunicipalityPrograms","foreignKey":{"name":"MunicipalityPrograms_municipalityId_fkey","columns":["municipalityId"],"references":{"schema":"public","table":"Municipality","columns":["id"]},"onDelete":"cascade"}}),
      this.dropConstraint({"schema":"public","table":"Participation","constraint":"Participation_schoolId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"Participation","foreignKey":{"name":"Participation_schoolId_fkey","columns":["schoolId"],"references":{"schema":"public","table":"School","columns":["id"]},"onDelete":"setNull"}}),
      this.dropConstraint({"schema":"public","table":"Participation","constraint":"Participation_programId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"Participation","foreignKey":{"name":"Participation_programId_fkey","columns":["programId"],"references":{"schema":"public","table":"Program","columns":["id"]},"onDelete":"setNull"}}),
      this.dropConstraint({"schema":"public","table":"ParticipationContacts","constraint":"ParticipationContacts_participationId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"ParticipationContacts","foreignKey":{"name":"ParticipationContacts_participationId_fkey","columns":["participationId"],"references":{"schema":"public","table":"Participation","columns":["id"]},"onDelete":"cascade"}}),
      this.dropConstraint({"schema":"public","table":"ParticipationContacts","constraint":"ParticipationContacts_contactId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"ParticipationContacts","foreignKey":{"name":"ParticipationContacts_contactId_fkey","columns":["contactId"],"references":{"schema":"public","table":"Contact","columns":["id"]},"onDelete":"cascade"}}),
      this.dropConstraint({"schema":"public","table":"ParticipationEmployees","constraint":"ParticipationEmployees_participationId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"ParticipationEmployees","foreignKey":{"name":"ParticipationEmployees_participationId_fkey","columns":["participationId"],"references":{"schema":"public","table":"Participation","columns":["id"]},"onDelete":"cascade"}}),
      this.dropConstraint({"schema":"public","table":"ParticipationEmployees","constraint":"ParticipationEmployees_employeeId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"ParticipationEmployees","foreignKey":{"name":"ParticipationEmployees_employeeId_fkey","columns":["employeeId"],"references":{"schema":"public","table":"Employee","columns":["id"]},"onDelete":"cascade"}}),
      this.dropConstraint({"schema":"public","table":"School","constraint":"School_branchId_fkey","kind":"foreignKey"}),
      this.addForeignKey({"schema":"public","table":"School","foreignKey":{"name":"School_branchId_fkey","columns":["branchId"],"references":{"schema":"public","table":"Branch","columns":["id"]},"onDelete":"setNull"}}),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
