import { Interaction, Participation, Person, PersonWithRole } from '../../types'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { columns as participationColumns } from '../columns/participations-columns'
import {columns as historyColumns} from '../columns/contact-history-columns'
import { DataTable } from '@/components/ui/data-table'
import { ContactInformationCardContainer } from '@/components/custom/details-components/contact-information-card-container'
import { OtherInformationCardContainer } from '@/components/custom/details-components/other-information-card-container'
import { NameInfoContainer } from '@/components/custom/details-components/name-info-container'
import { PersonEmailHistory } from '@/components/email/person-email-history'

type InteractionRow = Interaction & { personName: string; programName: string }

interface PersonDetailsPageProps {
    person: Person
    participations: Participation[]
    interactions: InteractionRow[]
}


export function PersonDetailsPage({person, participations, interactions}: PersonDetailsPageProps) {
    
    
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

            {/* Smart Emailing */}
            <PersonEmailHistory email={person.email} lastTrackedEmailAt={person.lastTrackedEmailAt} />
        </div>
    )
}
