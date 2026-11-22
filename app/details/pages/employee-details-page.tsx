import { Employee, EmployeeAssignment, Interaction, Participation, Person } from "@/app/types"
import { columns as participationColumns } from '../columns/participations-columns'
import {columns as historyColumns} from '../columns/contact-history-columns'
import {columns as assignmentColumns } from '../columns/assignment-columns'
import { DataTable } from "@/components/ui/data-table"
import { NameInfoContainer } from "@/components/custom/details-components/name-info-container"
import { ContactInformationCardContainer } from "@/components/custom/details-components/contact-information-card-container"
import { OtherInformationCardContainer } from "@/components/custom/details-components/other-information-card-container"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { PersonEmailHistory } from "@/components/email/person-email-history"

type InteractionRowEmp = Interaction & { personName: string; programName: string }

interface EmployeeDetailsPageProps {
    person: Person
    participations: Participation[]
    assignments: EmployeeAssignment[]
    employee: Employee,
    interactions: InteractionRowEmp[]
}

export function EmployeeDetailsPage({person, participations, assignments, employee, interactions} : EmployeeDetailsPageProps) {
    return (
        <div className="flex flex-col gap-8">
            {/* Name and status*/}
            <NameInfoContainer obj={person} type={'person'}/>
            
            {/* Contact and other information */}
            <div className="flex flex-row gap-4">
                <ContactInformationCardContainer obj={person}/>
                <OtherInformationCardContainer obj={person}/>
            </div>

            {/* Program Participations */} 
            <Card>
                <CardContent>
                    <CardTitle>Program Participations</CardTitle>
                    <DataTable columns={participationColumns} data={participations} paginationEnabled={false} visibleRows={5}/>
                </CardContent>
            </Card>


            {/* Contact History */}
            <Card>
                <CardContent>
                    <CardTitle>Contact History</CardTitle>
                    <DataTable columns={historyColumns} data={interactions} paginationEnabled={false} visibleRows={5}/>
                </CardContent>
            </Card>

            {/* Assignments */}
            <Card>
                <CardContent>
                    <CardTitle>Assignments</CardTitle>
                    <DataTable columns={assignmentColumns} data={assignments} paginationEnabled={false} visibleRows={5}/>
                </CardContent>
            </Card>

            {/* Smart Emailing */}
            <PersonEmailHistory email={person.email} lastTrackedEmailAt={person.lastTrackedEmailAt} />
        </div>
    )
}