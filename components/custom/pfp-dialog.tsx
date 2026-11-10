"use client"

import { Scalars } from "@prisma/orm-postgres/components";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DialogContent, DialogHeader } from "../ui/dialog";
import { Models } from "@/prisma/contract";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { changePFP } from "@/app/settings-actions";
import { useRouter } from "next/navigation";
import { nameInitials, showToast } from "@/lib/utils";
import { Separator } from "../ui/separator";

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
            <DialogHeader className="text-lg">Settings</DialogHeader>
            <div className="flex flex-row gap-5">
                <form action={handleSubmit} className="flex flex-col gap-2 items-center justify-start">
                    <span className="text-xs">Change Profile Picture</span>
                    <Avatar size="lg">
                        <AvatarImage src={employee.pfpImgUrl}/>
                        <AvatarFallback>{nameInitials(employee.name)}</AvatarFallback>
                    </Avatar>
                    <Input
                        name="employee-id"
                        type="hidden"
                        defaultValue={employee.id}
                    />
                    <Input
                        className="w-1/3"
                        name="img"
                        type="file"
                        placeholder="Choose File" // figure out how to modify this
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    />
                </form>

                <Separator orientation="vertical"/>

                

            </div>
        </DialogContent>
    )
}