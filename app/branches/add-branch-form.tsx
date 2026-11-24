"use client"

import { CustomSelect } from "@/components/custom/custom-dropdowns";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BRANCH_TYPES, REGION_TYPES } from "../types";
import { Button } from "@/components/ui/button";
import { CoordinatorSearch } from "@/components/custom/searches/coordinator-search";
import { createBranch } from "../actions/branches";
import { displayResult } from "@/lib/utils";




export function AddBranchForm() {
    
    async function handleSubmit(formData: FormData) {
        const result = await createBranch(formData)
        displayResult(result)
    }
    
    return (
        <form className="flex flex-col gap-3" action={handleSubmit}>
            <Field>
                <FieldLabel>Branch</FieldLabel>
                <CustomSelect name={"branchName"} type={BRANCH_TYPES} /> {/* Probs change this later? Although we can't change BranchTypes */}
            </Field>
            <Field>
                <FieldLabel>Institute</FieldLabel>
                <Input 
                    name="institute"
                    type="text"
                />
            </Field>
            <Field>
                <FieldLabel>Region</FieldLabel>
                <CustomSelect name={"region"} type={REGION_TYPES} />
            </Field>
            <Field>
                <FieldLabel>Chief</FieldLabel>
                <CoordinatorSearch/>
            </Field>
            <Button type="submit">Submit</Button>
        </form>
    )
}