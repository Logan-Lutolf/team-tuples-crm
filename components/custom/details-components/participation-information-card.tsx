"use client"

import { Person, Organization, ORG_TYPES, RELATIONSHIP_TYPES, REGION_TYPES, BRANCH_TYPES, Participation, ParticipationInfo, STATUS_TYPES } from "@/app/types";
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
import { updateParticipationInvolvements, updateParticipationOtherInformation } from "@/app/actions/participation";
import { RecordLink } from "@/components/records/record-link";
import { CoordinatorSearch } from "../searches/coordinator-search";
import { PersonSearch } from "../searches/person-search";
import { OrganizationSearch } from "../searches/organization-search";





interface ParticipationInfoCardProps {
    obj: ParticipationInfo
    editPermissions: boolean
}



export function ParticipationInfoCard({obj, editPermissions} : ParticipationInfoCardProps) {
    // Add chiefOf option too
    const [editing, setEditing] = useState(false)


    function handleEdit() {
        setEditing(!editing)
    }

    async function handleSubmit(formData: FormData) {
        let result = null

        result = await updateParticipationInvolvements(formData, obj.participation.id)
        
        if (result != null) {
            showToast("Success", result.message as string, result.result as "success" | "error" | "warning" | undefined)
        }
        else showToast("Error", "Update Failed", "error")

        setEditing(!editing)
    }


    if (editing) {
        return (
            <Card className="w-1/2 overflow-visible">
                <CardContent className="overflow-visible">
                    
                    <form action={handleSubmit}  className="flex flex-col gap-2">
                        <CardTitle className="flex flex-row justify-between items-center">
                            <span>Important Contact Information</span>
                            <div>
                                <Button type="submit" size="sm"><Save/></Button>
                                <Button size="sm" variant="destructive" onClick={handleEdit}><X/></Button>
                            </div>
                        </CardTitle>
                        <Field>
                            {/* <CoordinatorSearch/> */}
                            Update coordinator is broken right now.
                        </Field>
                        <Field>
                            {/* <PersonSearch/> */}
                            Update main contact is broken right now.
                        </Field>
                        <Field>
                            <OrganizationSearch/>
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
                    <div className="flex flex-row justify-between items-center">
                        <CardTitle>Involvements</CardTitle>
                        {editPermissions && <Button size="sm" onClick={() => setEditing(!editing)}><Pencil/></Button>}
                    </div>
                    <p>Coordinator: <RecordLink type={"employees"} id={obj.coordinator.id} children={obj.coordinator.name}/></p>
                    <p>Main Contact: <RecordLink type={"contacts"} id={obj.mainContact.id} children={obj.mainContact.name}/></p>
                    <p>Organization: <RecordLink type={"schools"} id={obj.participation.organizationId} children={obj.orgName} /></p>
                </CardContent>
            </Card>
        )    
    }
}


interface ParticipationOtherInfoCardProps {
    obj: Participation,
    editPermissions: boolean
}

export function ParticipationOtherInfoCard({obj, editPermissions} : ParticipationOtherInfoCardProps) {
    // Add chiefOf option too
    const [editing, setEditing] = useState(false)

    // Used to set default values of date input fields
    const toDateInput = (v?: string | null) => (v ? v.slice(0, 10) : "")


    function handleEdit() {
        setEditing(!editing)
    }

    async function handleSubmit(formData: FormData) {
        let result = null

        result = await updateParticipationOtherInformation(formData, obj.id)
        
        if (result != null) {
            showToast("Success", result.message as string, result.result as "success" | "error" | "warning" | undefined)
        }
        else showToast("Error", "Update Failed", "error")

        setEditing(!editing)
    }


    if (editing) {
        return (
            <Card className="w-1/2 overflow-visible">
                <CardContent className="overflow-visible">
                    
                    <form action={handleSubmit}  className="flex flex-col gap-2">
                        <CardTitle className="flex flex-row justify-between items-center">
                            <span>Other Information</span>
                            <div>
                                <Button type="submit" size="sm"><Save/></Button>
                                <Button size="sm" variant="destructive" onClick={handleEdit}><X/></Button>
                            </div>
                        </CardTitle>
                        <Field>
                            <CustomSelect type={STATUS_TYPES} name="status" defVal={obj.status}/>
                        </Field>
                        <Field>
                            <Input 
                                type="date"
                                name="startDate"
                                defaultValue={toDateInput(obj.startDate)}
                            />
                        </Field>
                        <Field>
                            <Input 
                                type="date"
                                name="endDate"
                                defaultValue={toDateInput(obj.endDate)}
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
                    <div className="flex flex-row justify-between items-center">
                        <CardTitle>Involvements</CardTitle>
                        {editPermissions && <Button size="sm" onClick={() => setEditing(!editing)}><Pencil/></Button>}
                    </div>
                    <p>Status: {obj.status}</p>
                    <p>Start Date: {obj.startDate}</p>
                    <p>End Date: {obj.endDate?? "Not specified."}</p>
                </CardContent>
            </Card>
        )    
    }
}