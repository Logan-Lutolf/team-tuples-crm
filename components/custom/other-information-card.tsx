import { Person, Organization } from "@/app/types";
import { programParsing, dateParsing } from "@/lib/utils";
import { Card, CardContent, CardTitle } from "../ui/card";




export function OtherInformationCard({obj} : {obj: Person | Organization}) {
    // Add chiefOf option too
    
    return (
        <Card className="w-1/2">
            <CardContent>
                <CardTitle>Other Information</CardTitle>
                <p>Branch Assigned: {"IMPLEMENT BRANCHES"}</p>
                {"region" in obj && <p>Region: {programParsing(obj.region)}</p>}
                <p>Created: {dateParsing(obj.createdAt)}</p>
                <p>Last Modified: {dateParsing(obj.updatedAt) ?? "Unmodified"}</p>
            </CardContent>
        </Card>
    )
}