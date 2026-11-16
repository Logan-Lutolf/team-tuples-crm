"use client"

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { getStudentCols, studentColumns } from "./columns";
import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectLabel, SelectTrigger, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select";

type Student = {
    name: string,
    dob: string,
    school: string,
    consent: string
}

export function ContactList() {
    const [students, setStudents] = useState<Student[]>([])

    const handleDelete = (name: string) =>
        setStudents((prev) => prev.filter((s) => s.name !== name));

    const columns = useMemo(() => getStudentCols(handleDelete), []);

    async function handleSubmit(formData: FormData) {
        const name = formData.get("name") as string
        const dob = formData.get("dob") as string
        const school = formData.get("school") as string
        const consent = formData.get("consent") as string

        setStudents((prev) => [...prev, { name, dob, school, consent}])
    }
    
    return (
        <div className="flex flex-row gap-3 p-5">
            <form action={handleSubmit} className="flex flex-col gap-3 w-1/3">
                <Field>
                    <Input 
                        name="name"
                        placeholder="Student Name"
                    />
                </Field>
                <Field>
                    <Input 
                        name="dob"
                        placeholder="Date of Birth (dd/mm/yyyy)"
                    />
                </Field>
                <Field>
                    <Input 
                        name="school"
                        placeholder="Name of School"
                    />
                </Field>
                <Field>
                    <Select name="consent">
                        <SelectTrigger>
                            <SelectValue placeholder="Consent Collected?"/>
                        </SelectTrigger>
                        <SelectContent >
                            <SelectGroup>
                                <SelectItem>Consent Collected?</SelectItem>
                                <SelectItem value={"Yes"}>Yes</SelectItem>
                                <SelectItem value={"No"}>No</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </Field>
                <Button type="submit">+Add to List</Button>
            </form>
            <Separator orientation="vertical"/>
            <div className="w-fit h-full">
                <DataTable data={students} columns={columns} paginationEnabled={false}/>
            </div>
        </div>
    )
}



