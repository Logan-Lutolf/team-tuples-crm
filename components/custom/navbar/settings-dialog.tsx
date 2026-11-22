"use client"

import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { DialogContent, DialogHeader } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { changePFP } from "@/app/actions/settings";
import { useRouter } from "next/navigation";
import { nameInitials, showToast } from "@/lib/utils";
import { Separator } from "../../ui/separator";
import { Employee, Person } from "@/app/types";
import { Attachment, AttachmentContent, AttachmentMedia } from "@/components/ui/attachment";
import { ImageIcon } from "lucide-react";



interface SettingsDialogProps {
    employee: Employee
    person: Person
}

export function SettingsDialog({employee, person}: SettingsDialogProps) {
    const router = useRouter()
    
    async function handleSubmit(formData: FormData) {
        const file = formData.get("img")
        if (file instanceof File && file.size > 3_000_000) {
            showToast("Error", "File too large: must be under 3mb.", "error")
            return
        }
        
        const result = await changePFP(formData)
        router.refresh()

        if (result) {
            if (result.result === "success") showToast("Success", result.message, "success")
            else showToast("Error", result.message, "error")
        }
    }
    //https://medium.com/@ctrlaltmonique/how-to-create-a-custom-file-upload-button-in-react-with-typescript-b08150f1532e
    return (
        <DialogContent>
            <DialogHeader className="text-lg">Settings</DialogHeader>
            <div className="flex flex-row gap-5">
                <form action={handleSubmit} className="flex flex-col gap-2 items-center justify-start">
                    <span className="text-xs">Change Profile Picture</span>
                    {/* <Avatar size="lg">
                        <AvatarImage src={employee.pfpImgUrl}/>
                        <AvatarFallback>{nameInitials(person.name)}</AvatarFallback>
                    </Avatar> */}

                    <Attachment>
                        <AttachmentMedia>
                            <ImageIcon/>
                        </AttachmentMedia>
                        <Input
                            className="w-1/3"
                            name="img"
                            type="file"
                            placeholder="Choose File" // figure out how to modify this
                            onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        />
                    </Attachment>

                    <Input
                        name="employee-id"
                        type="hidden"
                        defaultValue={person.id}
                    />
                    
                </form>

                <Separator orientation="vertical"/>

                

            </div>
        </DialogContent>
    )
}