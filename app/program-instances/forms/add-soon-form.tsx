"use client"

import { Dialog, BigDialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AddStudentForm } from "../add-student-form";
import { useState } from "react";
import { createSoonInstance } from "@/app/actions/program-instances";
import { showToast } from "@/lib/utils";

type Student = {
    name: string,
    dob: string,
    school: string
}


export function AddSoonForm() {
    const [students, setStudents] = useState<Student[]>([])
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        const result = await createSoonInstance(formData, students)
        showToast(
            result.result === "success" ? "Success" : "Error",
            result.message,
            result.result as "success" | "error"
        )
        if (result.result === "success") setStudents([])
}

return (
    <Dialog>
        <DialogTrigger render={<Button onClick={() => setOpen(true)}>Add Participation</Button>} />
        <BigDialogContent className="flex flex-col gap-4 max-h-[90vh]">

            {/* Empty form: just an anchor the fields below attach to */}
            <form id="soon-form" action={handleSubmit} />

            <div className="flex flex-row gap-5 p-5">
                <Field>
                    <Input form="soon-form" type="text" required placeholder="Name" name="name" />
                </Field>
                <Field>
                    <Input form="soon-form" type="text" required placeholder="Main Coordinator" name="main-coordinator" />
                </Field>
            </div>

            <div className="flex flex-row gap-5 p-5">
                <Field>
                    <FieldLabel>Start Date</FieldLabel>
                    <Input form="soon-form" type="date" required name="start" />
                </Field>
                <Field>
                    <FieldLabel>End Date</FieldLabel>
                    <Input form="soon-form" type="date" name="end" />
                </Field>
            </div>

            <div className="flex flex-row gap-2 items-start p-5">
                <AddStudentForm students={students} setStudents={setStudents} />
            </div>

            <div className="p-5 -mt-8">
                <Field>
                    <FieldLabel>Description/Notes</FieldLabel>
                    <Textarea form="soon-form" name="description" />
                </Field>
            </div>

            <div className="flex flex-row justify-end px-5 -mt-4">
                <Button onClick={() => setOpen(false)} form="soon-form" type="submit">Submit</Button>
            </div>
        </BigDialogContent>
    </Dialog>
)
}