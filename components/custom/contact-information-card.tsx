"use client"

import { formatPhoneNumber, formatAddress, showToast } from "@/lib/utils";
import { Card, CardContent, CardTitle } from "../ui/card";
import { Organization, Person, RoleTypes } from "@/app/types";
import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { Button } from "../ui/button";
import { updatePersonContactInfo, updateOrganizationContactInfo } from "@/app/details/actions";
import { Input } from "../ui/input";
import { Field, FieldLabel } from "../ui/field";


interface ContactInformationCardProps {
    obj: Person | Organization
    editPermissions: boolean
}


export function ContactInformationCard({obj, editPermissions} : ContactInformationCardProps) {
    const [editing, setEditing] = useState(false)


    function handleEdit() {
        setEditing(!editing)
    }

    async function handleSubmit(formData: FormData) {
        let result = null

        if ("dob" in obj)
            result = await updatePersonContactInfo(formData, obj.id)
        else if ("relationship" in obj)
            result = await updateOrganizationContactInfo(formData, obj.id)
        
        if (result != null) {
            showToast("Success", result.message, result.result as "success" | "error" | "warning" | undefined)
        }
        else showToast("Error", "Update Failed", "error")

        setEditing(!editing)
    }


    if (editing) {
        return (
            <Card className="w-1/2">
                <CardContent>
                    
                    <form action={handleSubmit}  className="flex flex-col gap-2">
                        <CardTitle className="flex flex-row justify-between items-center">
                        <span>Contact Information</span>
                        <div>
                            <Button type="submit" size="sm"><Save/></Button>
                            <Button size="sm" variant="destructive" onClick={handleEdit}><X/></Button>
                        </div>
                        
                    </CardTitle>
                        <Field className="flex flex-row gap-2 justify-start">
                            <Input 
                                name="email"
                                type="text"
                                defaultValue={obj.email ?? "Unknown Email"}
                            />
                        </Field>
                        <Field>
                            <Input 
                                name="phone"
                                type="text"
                                defaultValue={obj.phone ?? "Unknown Phone #"}
                            />
                        </Field>
                        <Field>
                            <Input 
                                name="address"
                                type="text"
                                defaultValue={formatAddress(obj.address)}
                            />
                        </Field>
                    </form>
                </CardContent>
            </Card>
        )    
    }
    else {
        return (
            <Card className="w-1/2">
                <CardContent>
                    <CardTitle className="flex flex-row justify-between items-center">
                        <span>Contact Information</span>
                        {editPermissions && <Button size="sm" onClick={handleEdit}><Pencil/></Button>}
                    </CardTitle>
                    <p>Email: {obj.email ?? "Unknown"}</p>
                    <p>Phone #: {formatPhoneNumber(obj.phone ?? "Unknown")}</p>
                    <p>Address: {obj.address ? formatAddress(obj.address) : "Unknown"}</p>
                </CardContent>
            </Card>
        )    
    }

    
}