// "use client"

// import { Dialog, BigDialogContent, DialogTrigger } from "@/components/ui/dialog";
// import { Field, FieldLabel } from "@/components/ui/field";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { AddStudentForm } from "../add-student-form";
// import { useState } from "react";
// import { createSoonInstance } from "@/app/actions/program-instances";
// import { showToast } from "@/lib/utils";

// type Student = {
//     name: string,
//     dob: string,
//     school: string
// }


// export function AddSoonForm() {
//     const [students, setStudents] = useState<Student[]>([])
//     const [open, setOpen] = useState(false)

//     async function handleSubmit(formData: FormData) {
//         const result = await createSoonInstance(formData, students)
//         showToast(
//             result.result === "success" ? "Success" : "Error",
//             result.message,
//             result.result as "success" | "error"
//         )
//         if (result.result === "success") setStudents([])
// }

// return (
//     <Dialog>
//         <DialogTrigger render={<Button onClick={() => setOpen(true)}>Add Participation</Button>} />
//         <BigDialogContent className="flex flex-col gap-4 max-h-[90vh]">

//             {/* Empty form: just an anchor the fields below attach to */}
//             <form id="soon-form" action={handleSubmit} />

//             <div className="flex flex-row gap-5 p-5">
//                 <Field>
//                     <Input form="soon-form" type="text" required placeholder="Name" name="name" />
//                 </Field>
//                 <Field>
//                     <Input form="soon-form" type="text" required placeholder="Main Coordinator" name="main-coordinator" />
//                 </Field>
//             </div>

//             <div className="flex flex-row gap-5 p-5">
//                 <Field>
//                     <FieldLabel>Start Date</FieldLabel>
//                     <Input form="soon-form" type="date" required name="start" />
//                 </Field>
//                 <Field>
//                     <FieldLabel>End Date</FieldLabel>
//                     <Input form="soon-form" type="date" name="end" />
//                 </Field>
//             </div>

//             <div className="flex flex-row gap-2 items-start p-5">
//                 <AddStudentForm students={students} setStudents={setStudents} />
//             </div>

//             <div className="p-5 -mt-8">
//                 <Field>
//                     <FieldLabel>Description/Notes</FieldLabel>
//                     <Textarea form="soon-form" name="description" />
//                 </Field>
//             </div>

//             <div className="flex flex-row justify-end px-5 -mt-4">
//                 <Button onClick={() => setOpen(false)} form="soon-form" type="submit">Submit</Button>
//             </div>
//         </BigDialogContent>
//     </Dialog>
// )
// }


"use client"

import { Dialog, BigDialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { showToast } from "@/lib/utils";
import { CoordinatorSearch } from "@/components/custom/searches/coordinator-search";
import { PersonSearch } from "@/components/custom/searches/person-search";
import { OrganizationSearch } from "@/components/custom/searches/organization-search";
import { StudentSearch } from "@/components/custom/searches/student-search";
import { Minus, Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { getStudentCols } from "../columns";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { addTheatreInstance } from "@/app/actions/participation";


type Student = {
    name: string,
    dob: string,
    org?: string,
    email?: string,
    phone?: string,
    guardianEmail: string,
    guardianPhone?: string
}


export function AddSoonForm() {
    const [open, setOpen] = useState(false)
    const [createNew, setCreateNew] = useState(false)
    const [students, setStudents] = useState<Student[]>([])

    // Could probably optimize this
    const [newName, setNewName] = useState("")
    const [newDob, setNewDob] = useState("")
    const [newEmail, setNewEmail] = useState("")
    const [newPhone, setNewPhone] = useState("")
    const [newGEmail, setNewGEmail] = useState("")
    const [newGPhone, setNewGPhone] = useState("")
    const [newOrg, setNewOrg] = useState("")

    const cols = useMemo(
            () => getStudentCols((index) =>
                setStudents(prev => prev.filter((_, i) => i !== index))
            ),
            [setStudents])


    function submitNewStudent() {
        setStudents(prev => [...prev, {
            name: newName,
            dob: newDob,
            org: newOrg,
            email: newEmail,
            phone: newPhone,
            guardianEmail: newGEmail,
            guardianPhone: newGPhone,
        }])

        setNewName("")
        setNewDob("")
        setNewEmail("")
        setNewPhone("")
        setNewGEmail("")
        setNewGPhone("")
        setNewOrg("")
    }

    async function handleSubmit(formData: FormData) {
        const result = await addTheatreInstance(formData)  // CHANGE THIS

        if (result.result == "Success") showToast(result.result, result.message, "success")
        else showToast(result.result, result.message, "error")
    }


    return (
        <Dialog>
            <DialogTrigger render={<Button onClick={() => setOpen(true)}>Add Participation</Button>} />
            <BigDialogContent className="flex flex-col gap-4 max-h-[90vh] max-w-[110vh]">
                <form className="p-5" action={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        {/* Instance name, teacher, coordinator */}
                        <FieldGroup className="gap-2">
                            <Field><Input name="students" value={JSON.stringify(students)} hidden/></Field>

                            <Field className="flex flex-row gap-2" orientation={"horizontal"}>
                                <FieldLabel className="w-1/4">Name: </FieldLabel>
                                <Input 
                                    name="name"
                                    type="text"
                                    className="w-3/4"
                                />
                            </Field>
                            <Field className="flex flex-row gap-2" orientation={"horizontal"}>
                                <FieldLabel className="w-1/4">Contact: </FieldLabel> 
                                <div className="w-3/4">
                                    <PersonSearch />
                                </div>
                            </Field>
                            <Field className="flex flex-row gap-2" orientation={"horizontal"}>
                                <FieldLabel className="w-1/4">Coordinator: </FieldLabel>
                                <div className="w-3/4">
                                    <CoordinatorSearch/>
                                </div>
                            </Field>
                        </FieldGroup>

                        {/* Start date, end date, and main organization? */}
                        <FieldGroup className="gap-2">
                            <Field className="flex flex-row gap-2" orientation={"horizontal"}>
                                <FieldLabel className="w-1/4">Start Date: </FieldLabel>
                                <Input 
                                    name="startDate"
                                    type="date"
                                    required
                                    className="w-3/4"
                                />
                            </Field>
                            <Field className="flex flex-row gap-2" orientation={"horizontal"}>
                                <FieldLabel className="w-1/4">End Date: </FieldLabel>
                                <Input 
                                    name="endDate"
                                    type="date"
                                    required
                                    className="w-3/4"
                                />
                            </Field>
                            <Field className="flex flex-row gap-2" orientation={"horizontal"}>
                                <FieldLabel className="w-1/4">Org: </FieldLabel>
                                <div className="w-3/4">
                                    <OrganizationSearch />
                                </div>
                            </Field>
                        </FieldGroup>
                    </div>

                    <div className="flex flex-col gap-4 mt-12">
                        <div className="flex flex-row gap-2">
                            <StudentSearch/>
                            <Button className="cursor-pointer" onClick={() => setCreateNew(true)}><Plus/> Create New</Button>
                        </div>
                        <DataTable columns={cols} data={students} paginationEnabled={false} visibleRows={3}/>
                    </div>

                    <Field className="mt-12">
                        <FieldLabel>Notes</FieldLabel>
                        <Textarea name="notes"/>
                    </Field>

                    <div className=" flex flex-row mt-4 justify-end">
                        <Button className="w-1/5 cursor-pointer" type="submit">Submit</Button>
                    </div>
                    
                    
                    
                </form>



                <Sheet open={createNew}>
                    <SheetContent className="px-4">
                        <SheetHeader className="mt-2 -px-4">
                            <SheetTitle>Create New Student</SheetTitle>
                            <SheetDescription>This will automatically create a new student in the list below, as well as the database.</SheetDescription>
                        </SheetHeader>

                        <FieldGroup className="flex flex-col gap-2">
                            <Field>
                                <FieldLabel>Student Name:</FieldLabel>
                                <Input 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    type="text"
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Date of Birth:</FieldLabel>
                                <Input 
                                    value={newDob}
                                    onChange={(e) => setNewDob(e.target.value)}
                                    type="date"
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Organization:</FieldLabel>
                                <OrganizationSearch setNewOrg={setNewOrg}/>
                            </Field>
                            <Field>
                                <FieldLabel>Email:</FieldLabel>
                                <Input 
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    type="text"
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Phone:</FieldLabel>
                                <Input 
                                    value={newPhone}
                                    type="text"
                                    onChange={(e) => setNewPhone(e.target.value)}
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Guardian Email:</FieldLabel>
                                <Input 
                                    value={newGEmail}
                                    type="text"
                                    onChange={(e) => setNewGEmail(e.target.value)}
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel>Guardian Phone:</FieldLabel>
                                <Input 
                                    value={newGPhone}
                                    type="text"
                                    onChange={(e) => setNewGPhone(e.target.value)}
                                />
                            </Field>
                        </FieldGroup>
                        <div className="flex flex-row gap-2 justify-end">
                            <Button onClick={() => setCreateNew(false)}>Cancel</Button>
                            <Button onClick={() => {setCreateNew(false); submitNewStudent()}}>Submit</Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </BigDialogContent>
        </Dialog>
    )
}