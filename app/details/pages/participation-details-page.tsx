import { Participation } from "@/app/types";
import { NameInfoContainer } from "@/components/custom/details-components/name-info-container";
import { ParticipationInfoCardContainer, ParticipationOtherInfoCardContainer } from "@/components/custom/details-components/participation-info-card-container";
import { ParticipationNotesContainer } from "@/components/custom/details-components/participation-notes-container";



export function ParticipationDetailsPage({part}: {part: Participation}) {
    return (
        <div className="flex flex-col gap-8">
            <NameInfoContainer type="participation" obj={part} />
            
            <div className="flex flex-row justify-between gap-8">
                <ParticipationInfoCardContainer part={part}/>
                <ParticipationOtherInfoCardContainer part={part}/>
            </div>
            
            <ParticipationNotesContainer part={part}/>

        </div>
    )
}
