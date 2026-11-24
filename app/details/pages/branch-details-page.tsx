import { Branch, Employee, EmployeePerson, PersonWithEmployee, PersonWithRole } from "@/app/types";
import { NameInfoContainer } from "@/components/custom/details-components/name-info-container";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {columns as contactColumns} from '@/components/custom/columns/contact-columns'
import {columns as employeeColumns} from '@/components/custom/columns/employee-columns'
import { BranchInformationCardContainer } from "@/components/custom/details-components/branch-information-container";


interface BranchDetailsPageProps {
    branch: Branch
    employees: PersonWithEmployee[]
    contacts: PersonWithRole[]
}

export function BranchDetailsPage({branch, employees, contacts}: BranchDetailsPageProps) {
    return (
        <div className="flex flex-col gap-8">
            {/* Name and status*/}
            <NameInfoContainer obj={branch} type={'branch'}/>
            
            {/* Contact and other information */}
            <div className="flex flex-row gap-4">
                <BranchInformationCardContainer obj={branch} />
            </div>

            {/* Branch Employees */}
            <Card>
                <CardContent>
                    <CardTitle>Branch Employees</CardTitle>
                    <DataTable columns={employeeColumns} data={employees} paginationEnabled={false} visibleRows={5}/>
                </CardContent>
            </Card>

            {/* Branch Contacts */}
            <Card>
                <CardContent>
                    <CardTitle>Branch Contacts</CardTitle>
                    <DataTable columns={contactColumns} data={contacts} paginationEnabled={false} visibleRows={5}/>
                </CardContent>
            </Card>

            
        </div>
    )
}