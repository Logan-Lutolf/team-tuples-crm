import { formatPhoneNumber, formatAddress } from "@/lib/utils";
import { Card, CardContent, CardTitle } from "../ui/card";
import { Organization, Person } from "@/app/types";



export function ContactInformationCard({obj} : {obj: Person | Organization}) {
    return (
        <Card className="w-1/2">
            <CardContent>
                <CardTitle>Contact Information</CardTitle>
                <p>Email: {obj.email ?? "Unknown"}</p>
                <p>Phone #: {formatPhoneNumber(obj.phone ?? "Unknown")}</p>
                <p>Address: {obj.address ? formatAddress(obj.address) : "Unknown"}</p>
            </CardContent>
        </Card>
    )
}