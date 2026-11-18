"use client"

import { PersonWithRole } from "@/app/types";
import { Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Field } from "../ui/field";
import { SelectPersonRole } from "../custom-dropdowns";
import { updateNameAndRole } from "@/app/actions/person";
import { showToast } from "@/lib/utils";


interface PersonNameAndRoleProps {
    person: PersonWithRole
    editPermission: boolean
}


export function PersonNameAndRole({person, editPermission} : PersonNameAndRoleProps) {
    const [editing, setEditing] = useState(false)

    function handleEdit() {
        setEditing(!editing)
    }

    async function handleSubmit(formData: FormData) {
        const result = await updateNameAndRole(formData, person.id)
        if (result?.result == "success") showToast("Success", result.message, "success")
        else showToast(result?.result?? "Error", result?.message ?? "", "error")
        
        setEditing(!editing)
    }
    
    
    
    if (!editing) {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center">
                    <p className="text-3xl">{person.name}</p>
                    {editPermission && <Button size="xs" onClick={handleEdit}><Pencil/></Button>}
                </div>
                <p className="text-base font-light italic">{person.personRole?.[0]?.type ?? "Unknown"}</p>
            </div>
        )
    }
    else {
        return (
            <form action={handleSubmit}  className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center">
                    <Field className="max-w-1/3">
                        <Input name="name" defaultValue={person.name}/>
                    </Field>
                    <div className="">
                        <Button type="submit" size="sm"><Save/></Button>
                        <Button size="sm" variant="destructive" onClick={handleEdit}><X/></Button>
                    </div>
                </div>
                <p className="text-base font-light italic"><SelectPersonRole /></p>
            </form>
        )
    }
}