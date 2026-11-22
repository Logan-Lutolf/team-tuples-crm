"use client"

import { updateParticipationNotes } from "@/app/actions/participation";
import { Participation } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/lib/utils";
import { Pencil, Save, X } from "lucide-react";
import { useState } from "react";


interface ParticipationNotesProps {
    part: Participation,
    editPermission: boolean
}

export function ParticipationNotes({part, editPermission}: ParticipationNotesProps) {
    const [editing, setEditing] = useState(false)
    
    function handleEdit() {
            setEditing(!editing)
        }
    
        async function handleSubmit(formData: FormData) {
            let result = null
    
            result = await updateParticipationNotes(formData, part.id)
            
            if (result != null) {
                showToast("Success", result.message as string, result.result as "success" | "error" | "warning" | undefined)
            }
            else showToast("Error", "Update Failed", "error")
    
            setEditing(!editing)
        }


    if (editing) {
        return (
            <Card className="w-full">
                <CardContent className="">
                    <form action={handleSubmit}  className="flex flex-col gap-2">
                        <CardTitle className="flex flex-row justify-between items-center">
                            <span>Notes</span>
                            <div>
                                <Button type="submit" size="sm"><Save/></Button>
                                <Button size="sm" variant="destructive" onClick={handleEdit}><X/></Button>
                            </div>
                        </CardTitle>
                        <Field>
                            <Textarea 
                                name="notes"
                                defaultValue={part.notes?? ""}
                                className="whitespace-pre-wrap break-words"
                            />
                        </Field>
                    </form>
                </CardContent>
            </Card>
        )    
    }
    else {
        return (
            <Card className="w-full">
                <CardContent className="">
                        <CardTitle className="flex flex-row justify-between items-center">
                            <span>Notes</span>
                            <Button size="sm" variant="default" onClick={handleEdit}><Pencil/></Button>
                        </CardTitle>
                        <p className="whitespace-pre-wrap break-words">{part.notes}</p>
                </CardContent>
            </Card>
        )
    }
}    