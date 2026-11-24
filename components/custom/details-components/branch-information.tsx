"use client"

import { formatPhoneNumber, formatAddress, showToast, displayResult, camelCaseIt } from "@/lib/utils";
import { Card, CardContent, CardTitle } from "../../ui/card";
import { Branch, REGION_TYPES } from "@/app/types";
import { useState } from "react";
import { Landmark, Mail, MapPin, Pencil, Phone, Save, UserStar, X } from "lucide-react";
import { Button } from "../../ui/button";
import { updatePersonContactInfo, updateOrganizationContactInfo } from "@/app/details/actions";
import { Input } from "../../ui/input";
import { Field, FieldLabel } from "../../ui/field";
import { Aoboshi_One } from "next/font/google";
import { CustomSelect } from "../custom-dropdowns";
import { updateBranch } from "@/app/actions/branches";


interface BranchInformationCardProps {
    obj: Branch
    editPermissions: boolean
}


export function BranchInformationCard({obj, editPermissions} : BranchInformationCardProps) {
    const [editing, setEditing] = useState(false)


    function handleEdit() {
        setEditing(!editing)
    }

    async function handleSubmit(formData: FormData) {
        const result = await updateBranch(formData, obj.id)
        
        displayResult(result ?? undefined)

        setEditing(!editing)
    }


    if (editing) {
        return (
            <Card className="w-1/2">
                <CardContent>
                    <form action={handleSubmit}  className="flex flex-col gap-2">
                        <CardTitle className="flex flex-row justify-between items-center">
                        <span>Branch Information</span>
                        <div>
                            <Button type="submit" size="sm"><Save/></Button>
                            <Button size="sm" variant="destructive" onClick={handleEdit}><X/></Button>
                        </div>
                        
                    </CardTitle>
                        <Field className="flex flex-row gap-2 justify-start">
                            <Input 
                                name="institute"
                                type="text"
                                defaultValue={camelCaseIt(obj.institute ?? "Unknown Institute")}
                            />
                        </Field>
                        <Field>
                            <Input 
                                name="chief"
                                type="text"
                                defaultValue={obj.chiefId ?? "No Chief Assigned"}
                            />
                        </Field>
                        <Field>
                            <CustomSelect name="region" type={REGION_TYPES} defVal={obj.region}/>
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
                        <span>Branch Information</span>
                        {editPermissions && <Button size="sm" onClick={handleEdit}><Pencil/></Button>}
                    </CardTitle>
                    <p className="flex flex-row items-center gap-2"><Landmark size={15}/> {camelCaseIt(obj.institute ?? "Unknown Institute")}</p>
                    <p className="flex flex-row items-center gap-2"><UserStar size={15}/> {obj.chiefId ?? "No Chief Assigned"}</p>
                    <p className="flex flex-row items-center gap-2"><MapPin size={15}/> {obj.region ? camelCaseIt(obj.region) : "Unknown Region"}</p>
                </CardContent>
            </Card>
        )    
    }

    
}