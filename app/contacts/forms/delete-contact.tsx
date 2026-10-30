'use client'

import { ContactActionForm } from "./contact-action-form";
import { Field, FieldLabel } from "@/components/ui/field";
import { deleteContact } from "../actions_contacts";
import { Input } from "@/components/ui/input";
import { DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


interface DeleteContactFormProps {
    contactId: number;
    contactName: string;
}

export function DeleteContactForm({ contactId, contactName }: DeleteSchoolFormProps) {
    return(
        <ContactActionForm action={deleteContact}>
            <Input type="hidden" name="school-id" value={contactId} />
            <Field>
                <FieldLabel>
                    Are you sure you want to delete {contactName}? <br/> If so, type &apos;delete&apos; to confirm.
                </FieldLabel>
                <Input 
                    name='confirm-delete'
                    type='text'
                    required
                />
            </Field>
            <div className="flex flex-row justify-end gap-4 mt-3">
                <DialogClose render={<Button type="button">Cancel</Button>}/>
                <Button type="submit" variant="destructive">Delete</Button>
            </div>
            
            
        </ContactActionForm>
    )
}