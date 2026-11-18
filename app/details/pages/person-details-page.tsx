import { Circle } from 'lucide-react'
import { EmployeeAssignment, Participation, Person, PersonWithRole } from '../../types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { columns as participationColumns } from '../columns/participations-columns'
import {columns as assignmentColumns } from '../columns/assignment-columns'
import { DataTable } from '@/components/ui/data-table'
import { ContactInformationCard } from '@/components/custom/contact-information-card'
import { OtherInformationCard } from '@/components/custom/other-information-card'
import { ContactInformationCardContainer } from '@/components/custom/contact-information-card-container'
import { OtherInformationCardContainer } from '@/components/custom/other-information-card-container'
import { PersonNameAndRole } from '@/components/custom/name-info-form'
import { NameInfoContainer } from '@/components/custom/name-info-container'


interface PersonDetailsPageProps {
    person: Person
    participations: Participation[]
}


export function PersonDetailsPage({person, participations}: PersonDetailsPageProps) {
    
    
    return (
        <div className="flex flex-col gap-8">
            {/* Name and status*/}
            <NameInfoContainer obj={person}/>
            
            {/* Contact and other information */}
            <div className="flex flex-row gap-4">
                <ContactInformationCardContainer obj={person}/>
                <OtherInformationCardContainer obj={person}/>
            </div>

            {/* Program Participations */} 
            <div>
                <span>Program Participations</span>
                <DataTable columns={participationColumns} data={participations} paginationEnabled={false} visibleRows={5}/>  
            </div>

            {/* Contact History */}
            <div>
                <span>Contact History</span>
            </div>
        </div>
    )
}