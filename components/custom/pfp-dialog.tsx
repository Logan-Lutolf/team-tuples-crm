"use client"

import { Scalars } from "@prisma/orm-postgres/components";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DialogContent, DialogHeader } from "../ui/dialog";
import { Models } from "@/prisma/contract";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { changePFP } from "@/app/settings-actions";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/utils";

type Employee = Scalars<Models.public_Employee>


interface SettingsDialogProps {
    employee: Employee
}

export function SettingsDialog({employee}: SettingsDialogProps) {
    const router = useRouter()
    
    async function handleSubmit(formData: FormData) {
        const result = await changePFP(formData)
        router.refresh()

        if (result) {
            if (result.result === "success") showToast("Success", result.message, "success")
            else showToast("Error", result.message, "error")
        }
    }
    
    return (
        <DialogContent>
            <DialogHeader>Settings</DialogHeader>
            <div className="flex flex-row gap-5">
                <form action={handleSubmit}  className="flex flex-col gap-2">
                    Change Profile Picture
                    <Avatar>
                        <AvatarImage src={employee.pfpImgUrl}/>
                        <AvatarFallback>{employee.name.substring(0,1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <Input
                        name="employee-id"
                        type="hidden"
                        defaultValue={employee.id}
                    />
                    <Input
                        name="img"
                        type="file"
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    />
                </form>

            </div>
        </DialogContent>
    )
}