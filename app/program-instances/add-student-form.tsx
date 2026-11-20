"use client"

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/utils";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { getStudentCols, studentColumns } from "./columns";
import { CustomSelect } from "@/components/custom/custom-dropdowns";
import { BRANCH_TYPES, CONTACT_TYPES } from "../types";

type Student = {
    name: string,
    dob: string,
    school: string
}

interface AddStudentFormProps {
    students: Student[],
    setStudents: Dispatch<SetStateAction<Student[]>>
}


export function AddStudentForm({students, setStudents} : AddStudentFormProps) {
    const cols = useMemo(
        () => getStudentCols((index) =>
            setStudents(prev => prev.filter((_, i) => i !== index))
        ),
        [setStudents])


    async function handleSubmit(formData: FormData) {
        const name = formData.get("name") as string
        const dob = formData.get("dob") as string
        const school = formData.get("school") as string
        setStudents(prev => [...prev, { name, dob, school }])
    } 


    return (
        <div className="flex flex-row gap-3 items-start">
            <form action={handleSubmit}  className="flex flex-col gap-3 w-1/3">
                <Field>
                    <Input 
                        name="name"
                        placeholder="Student Name"
                    />
                </Field>
                <Field>
                    <CustomSelect name="occupation" type={CONTACT_TYPES} />
                </Field>
                <Field>
                    <Input 
                        name="dob"
                        type="date"
                        placeholder="Date of Birth (dd-mm-yyyy)"
                    />
                </Field>
                <Field>
                    <Input 
                        name="school"
                        placeholder="Name of School"
                    />
                </Field>
                <Button type="submit">+Add to List</Button>
            </form>
            <div className="w-2/3">
                <DataTable columns={cols} data={students} paginationEnabled={false} visibleRows={3}/>
            </div>
            
        </div>
    )
}



