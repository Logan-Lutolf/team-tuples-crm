"use client"

import { Branch, CONTACT_TYPES, ORG_TYPES, Organization, PersonWithRole, PROGRAM_TYPES } from "@/app/types";
import { Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Field } from "../../ui/field";
import { CustomSelect } from "../custom-dropdowns";
import { updateNameAndRole } from "@/app/actions/person";
import { camelCaseIt, displayResult, showToast } from "@/lib/utils";
import { updateOrg } from "@/app/actions/organization";
import { updateBranch } from "@/app/actions/branches";
import { EntityType, LoadedMap } from "./name-info-types";
import { updateParticipationNameAndType } from "@/app/actions/participation";


// Registry & Strategy Pattern for generic components!!!!!
// I <3 strategy pattern omg
// Written with Claude, notes and modifcations made by Charlotte (gotta learn, after all :P)


// Template for everything the UI has to know about each entity type
type Config<T> = {
    getName: (obj: T) => string,
    getSubtitle?: (obj: T) => string,
    update: (formData: FormData, id: number) => Promise<{ result?: string; message?: string } | undefined>,
    extraField?: (obj: T) => React.ReactNode
}

// Runtime object 
// For each key K in EntityType, the value must be a Config of the matching object type.
const configs: {[K in EntityType]:  Config<LoadedMap[K]>} = {
    person: {
        getName: p => p.name,
        getSubtitle: p => p.personRole? camelCaseIt(p.personRole) : "Unknown Role",
        update: updateNameAndRole,
        extraField: (p) => <CustomSelect name="role" type={CONTACT_TYPES} defVal={p.personRole ?? "Unknown Role"} />,
    },
    org: {
        getName: o => o.name,
        getSubtitle: o => o.type? camelCaseIt(o.type) : "Unknown Type",
        update: updateOrg,
        extraField: (o) => <CustomSelect name="type" type={ORG_TYPES} defVal={o.type?.toString()}/>
    },
    branch: {
        getName: b => camelCaseIt(b.name),
        getSubtitle: b => b.region? camelCaseIt(b.region) : "Unknown Region",
        update: updateBranch
    },
    participation: {
        getName: p => p.name,
        getSubtitle: p => p.programType? camelCaseIt(p.programType) : "Unkown Program Type",
        update: updateParticipationNameAndType // change this later
    },
}


// K is a placeholder that must be one of the keys, and it links type and obj together
export function NameInfo<K extends EntityType>({type, obj, editPermission}: {
    type: K,
    obj: LoadedMap[K],
    editPermission: boolean
}) {
    const config = configs[type] as Config<LoadedMap[K]>  // Pick what config the component will be using
    
    const [editing, setEditing] = useState(false)


    function handleEdit() {
        setEditing(!editing)
    }

    async function handleSubmit(formData: FormData) {
        const result = await config.update(formData, obj.id)
        
        displayResult(result)
        
        setEditing(!editing)
    }

    const isParticipation: boolean = type === "participation"

    if (!editing) {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center">
                    <p className="text-3xl">{config.getName(obj)}</p>
                    {editPermission && <Button size="xs" onClick={handleEdit}><Pencil/></Button>}
                </div>
                <p className="text-base font-light italic">{config.getSubtitle?.(obj)}</p>
            </div>
        )
    }
    else {
        return (
            <form action={handleSubmit}  className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center">
                    <Field className="max-w-1/3">
                        <Input name="name" defaultValue={config.getName(obj)}/>
                    </Field>

                    <div className="">
                        <Button type="submit" size="sm"><Save/></Button>
                        <Button size="sm" variant="destructive" onClick={handleEdit}><X/></Button>
                    </div>
                </div>
                {config.extraField?.(obj)}
            </form>
        )
    }
}