import { Employee, EmployeeAssignment, Participation, Person } from "@/app/types"
import { PersonDetailsPage } from "./person-details-page"
import {columns as assignmentColumns } from '../columns/assignment-columns'
import { DataTable } from "@/components/ui/data-table"


interface EmployeeDetailsPageProps {
    person: Person
    participations: Participation[]
    assignments: EmployeeAssignment[]
    employee: Employee
}

export function EmployeeDetailsPage({person, participations, assignments, employee} : EmployeeDetailsPageProps) {
    return (
        <>
            <PersonDetailsPage person={person} participations={participations}  />
        
            {/* School Contacts */}
            <div>
                <span>Assignments</span>
                <DataTable columns={assignmentColumns} data={assignments} paginationEnabled={false} visibleRows={5}/>
            </div>
            
        </>
        
    )
}