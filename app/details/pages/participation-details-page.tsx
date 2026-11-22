import { Participation, PersonWithStudent } from "@/app/types";
import { NameInfoContainer } from "@/components/custom/details-components/name-info-container";
import { ParticipationInfoCardContainer, ParticipationOtherInfoCardContainer } from "@/components/custom/details-components/participation-info-card-container";
import { ParticipationNotesContainer } from "@/components/custom/details-components/participation-notes-container";
import { DataTable } from "@/components/ui/data-table";
import { studentColumns } from "../columns/contacts-columns";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface ParticipationDetailsPageProps {
    part: Participation,
    contacts: PersonWithStudent[]
}

export function ParticipationDetailsPage({part, contacts}: ParticipationDetailsPageProps) {
    return (
        <div className="flex flex-col gap-8">
            <NameInfoContainer type="participation" obj={part} />
            
            <div className="flex flex-row justify-between gap-8">
                <ParticipationInfoCardContainer part={part}/>
                <ParticipationOtherInfoCardContainer part={part}/>
            </div>
            
            <ParticipationNotesContainer part={part}/>

            {/* Program Participations */} 
            <Card>
                <CardContent>
                    <CardTitle>Involved Students</CardTitle>
                    <DataTable columns={studentColumns} data={contacts} paginationEnabled={false} visibleRows={5}/>  
                </CardContent>
            </Card>
        </div>
    )
}
