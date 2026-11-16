import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { OtpForm } from "./otp-form";



export function OtpFormContainer({userId}: {userId: number}) {
    return(
        <Card className="w-2/5">
            <CardContent className="flex flex-col justify-start">
                <CardDescription className="text-lg font-normal text-black">Change One Time Password</CardDescription>
                <CardDescription>Because this is your first login, you must change your password.</CardDescription>
                <OtpForm employeeId={userId}/>
            </CardContent>
        </Card>
    ) 
}