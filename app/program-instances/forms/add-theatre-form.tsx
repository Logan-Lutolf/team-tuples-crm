"use client"

import { Dialog, BigDialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { showToast } from "@/lib/utils";
import { CoordinatorSearch } from "@/components/custom/searches/coordinator-search";
import { PersonSearch } from "@/components/custom/searches/person-search";
import { OrganizationSearch } from "@/components/custom/searches/organization-search";

type Student = {
    name: string,
    dob: string,
    school: string
}


export function AddTheatreForm() {
    const [open, setOpen] = useState(false)



    return (
        <Dialog>
            <DialogTrigger render={<Button onClick={() => setOpen(true)}>Add Participation</Button>} />
            <BigDialogContent className="flex flex-col gap-4 max-h-[90vh]">
                <form className="p-5">
                    {/* Instance name, teacher, coordinator */}
                    <div className="flex flex-row justify-between gap-8">
                            <FieldGroup className="w-1/2">
                                <Field className="flex flex-row gap-2" orientation={"horizontal"}>
                                    <FieldLabel>Name: </FieldLabel>
                                    <Input 
                                        name="program-name"
                                        type="text"
                                    />
                                </Field>
                                <Field className="flex flex-row gap-2" orientation={"horizontal"}>
                                    <FieldLabel>Contact: </FieldLabel> {/* Maybe name this primary contact instead? */}
                                    <PersonSearch />
                                </Field>
                                <Field className="flex flex-row gap-2" orientation={"horizontal"}>
                                    <FieldLabel>Coordinator: </FieldLabel>
                                    <CoordinatorSearch/>
                                </Field>
                            </FieldGroup>

                            <FieldGroup className="w-1/2">
                                <Field className="flex flex-row gap-2" orientation={"horizontal"}>
                                    <FieldLabel>Start Date: </FieldLabel>
                                    <Input 
                                        name="start-date"
                                        type="date"
                                        required
                                    />
                                </Field>
                                <Field className="flex flex-row gap-2" orientation={"horizontal"}>
                                    <FieldLabel>End Date: </FieldLabel>
                                    <Input 
                                        name="end-date"
                                        type="date"
                                    />
                                </Field>
                                <Field className="flex flex-row gap-2" orientation={"horizontal"}>
                                    <FieldLabel>Organization: </FieldLabel>
                                    <OrganizationSearch />
                                </Field>
                        </FieldGroup>
                    </div>
                    



                </form>
                
                



                {/* Start date, endDate?, organization? */}









            </BigDialogContent>
        </Dialog>
    )
}