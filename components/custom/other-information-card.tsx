import { Person, Organization } from "@/app/types";
import { programParsing, dateParsing } from "@/lib/utils";
import { Card, CardContent, CardTitle } from "../ui/card";




export function OtherInformationCard({obj} : {obj: Person | Organization}) {
    return (
        <Card className="w-1/2">
            <CardContent>
                <CardTitle>Other Information</CardTitle>
                <p>Branch Assigned: {"IMPLEMENT BRANCHES"}</p>
                <p>Region: {"region" in obj ? programParsing(obj.region) : "Unknown"}</p>
                <p>Created: {dateParsing(obj.createdAt)}</p>
                <p>Last Modified: {dateParsing(obj.updatedAt) ?? "Unmodified"}</p>
            </CardContent>
        </Card>
    )
}