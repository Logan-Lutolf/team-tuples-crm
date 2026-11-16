import { cookies } from "next/headers";
import { OtpForm } from "./otp-form";
import { decrypt } from "../login/sessions";
import { OtpFormContainer } from "./otp-form-container";



export default async function OtpPage() {
    let userId: number = -1
    
        try {
            const cookiesStore = await cookies()
            const session = cookiesStore.get("session")?.value
            const payload = await decrypt(session)
    
            userId = payload?.userId ?? -1
        }
        catch (error) {
            console.log("Error reading session cookie: ", error)
        }
    
    return (
        <div className="flex flex-col justify-center items-center mt-4">
            <OtpFormContainer userId={userId}/>
        </div>
    )
}