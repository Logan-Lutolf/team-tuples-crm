"use client"

import { Person, Organization, ORG_TYPES, RELATIONSHIP_TYPES, REGION_TYPES, BRANCH_TYPES } from "@/app/types";
import { programParsing, dateParsing, showToast } from "@/lib/utils";
import { Card, CardContent, CardTitle } from "../../ui/card";
import { useState } from "react";
import { updateOrganizationOtherInfo, updatePersonOtherInfo } from "@/app/details/actions";
import { Button } from "../../ui/button";
import { Pencil, Save, X } from "lucide-react";
import { Field } from "../../ui/field";
import { Input } from "../../ui/input";
import { CustomSelect } from "../custom-dropdowns";
import { z } from 'zod'


interface OtherInformationCardProps {
    obj: Person | Organization
    editPermissions: boolean
}



export function OtherInformationCard({obj, editPermissions} : OtherInformationCardProps) {
    // Add chiefOf option too
    const [editing, setEditing] = useState(false)


    function handleEdit() {
        setEditing(!editing)
    }

    async function handleSubmit(formData: FormData) {
        let result = null

        if ("dob" in obj)
            result = await updatePersonOtherInfo(formData, obj.id)
        else if ("relationship" in obj)
            result = await updateOrganizationOtherInfo(formData, obj.id) // only diff is that this has a region 
        
        if (result != null) {
            showToast("Success", result.message as string, result.result as "success" | "error" | "warning" | undefined)
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
                        <span>Other Information</span>
                        <div>
                            <Button type="submit" size="sm"><Save/></Button>
                            <Button size="sm" variant="destructive" onClick={handleEdit}><X/></Button>
                        </div>
                        
                    </CardTitle>
                        <Field className="flex flex-row gap-2 justify-start">
                            <CustomSelect name="branch" type={BRANCH_TYPES}/>
                        </Field>
                        {"region" in obj && 
                            <Field>
                                <CustomSelect name="region" type={REGION_TYPES}/>
                            </Field>
                        }
                        <p>Created: {dateParsing(obj.createdAt)}</p>
                        <p>Last Modified: {dateParsing(obj.updatedAt) ?? "Unmodified"}</p>
                    </form>
                </CardContent>
            </Card>
        )    
    }
    else {
        return (
            <Card className="w-1/2">
                <CardContent>
                    <div className="flex flex-row justify-between items-center">
                        <CardTitle>Other Information</CardTitle>
                        {editPermissions && <Button size="sm" onClick={() => setEditing(!editing)}><Pencil/></Button>}
                    </div>
                    <p>Branch Assigned: {obj.branchName}</p>
                    {"region" in obj && <p>Region: {programParsing(obj.region)}</p>}
                    <p>Created: {dateParsing(obj.createdAt)}</p>
                    <p>Last Modified: {dateParsing(obj.updatedAt) ?? "Unmodified"}</p>
                </CardContent>
            </Card>
        )    
    }
}