import { Circle } from 'lucide-react'
import { Organization, OrganizationPerson, Participation, Person, PersonWithRole } from '../../types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dateParsing, formatAddress, formatPhoneNumber, programParsing, relationshipToColor } from '@/lib/utils'
import { columns as participationColumns } from '../columns/participations-columns'
import {columns as contactColumns } from '../columns/contacts-columns'
import { DataTable } from '@/components/ui/data-table'
import { ContactInformationCard } from '@/components/custom/contact-information-card'
import { OtherInformationCard } from '@/components/custom/other-information-card'
import { ContactInformationCardContainer } from '@/components/custom/contact-information-card-container'
import { OtherInformationCardContainer } from '@/components/custom/other-information-card-container'


interface OrganizationsDetailsPageProps {
    organization: Organization
    participations: Participation[]
    contacts: PersonWithRole[]
}


export function OrganizationDetailsPage({organization, participations, contacts}: OrganizationsDetailsPageProps) {
    const rows: OrganizationPerson[] = contacts.map((contact) => ({
        person: contact,
        organization,
        roles: contact.personRole,
    }))
    
    return (
        <div className="flex flex-col gap-8">
            {/* Name and status*/}
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center">
                    <Circle fill={relationshipToColor(organization.relationship)} strokeWidth={1}/>
                    <p className="text-3xl">{organization.name}</p>
                </div>
                <p className="text-base font-light italic">{organization.type}</p>
            </div>
            
            {/* Contact and other information */}
            <div className="flex flex-row gap-4">
                <ContactInformationCardContainer obj={organization}/>
                <OtherInformationCardContainer obj={organization}/>
            </div>

            {/* School Contacts */}
            <div>
                <span>Organization Contacts</span>
                <DataTable columns={contactColumns} data={rows} paginationEnabled={false} visibleRows={5}/>
            </div>

            {/* Program Participations */} 
            <div>
                <span>Program Participations (MAKE THIS SCROLLABLE)</span>
                <DataTable columns={participationColumns} data={participations} paginationEnabled={false} visibleRows={5}/>  
            </div>

            {/* Contact History */}
            <div>
                <span>Contact History</span>
            </div>
        </div>
    )
}