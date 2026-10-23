'use client'

import { useForm } from "@tanstack/react-form"
import { Field, FieldLabel } from "../../components/ui/field"
import { Input } from "../../components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DialogClose } from "@/components/ui/dialog"

/* Probs need to change this */
enum Role { 
ADMIN = "ADMIN",
WORKSHOPS_COORDINATOR = "WORKSHOPS_COORDINATOR",
SCHOOL_NETWORK_COORDINATOR = "SCHOOL_NETWORK_COORDINATOR",
STORIES_OF_OUR_NEIGHBORS_COORDINATOR = "STORIES_OF_OUR_NEIGHBORS_COORDINATOR",
VETERANS_DAY_COORDINATOR = "VETERANS_DAY_COORDINATOR",
NEWSLETTER_COORDINATOR = "NEWSLETTER_COORDINATOR"
}

/* Probs need to change this */
const role = [
    {label: "Admin", value: Role.ADMIN},
    {label: "Workshops Coordinator", value: Role.WORKSHOPS_COORDINATOR},
    {label: "School Network Coordinator", value: Role.SCHOOL_NETWORK_COORDINATOR},
    {label: "Stories of our Neighbors Coordinator", value: Role.STORIES_OF_OUR_NEIGHBORS_COORDINATOR},
    {label: "Veterans Day Coordinator", value: Role.VETERANS_DAY_COORDINATOR},
    {label: "Newsletter Coordinator", value: Role.NEWSLETTER_COORDINATOR}
]

const addressInfo = [
    { name: "city", label: "City:" },
    { name: "country", label: "Country:" },
    { name: "zipCode", label: "Zip Code:" },
] as const


interface AddEmployeeFormValues {
    name: string
    email: string
    phone: string
    role: Role | null // Double check that this actually works
    street: string
    city: string
    country: string
    zipCode: string
}


/* 
    I think we should make it so that new users have to log in and input their address, so Admins don't have to put that in themselves.
*/


export function AddEmployeeForm() {
    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            role: null,
            street: "",
            city: "",
            country: "",
            zipCode: ""
        } as AddEmployeeFormValues,
        onSubmit: () => {}
    })

    return (
        <form className="flex flex-col gap-3"
            onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
                
            }}
        >
            <h1> Add an Employee </h1>


            <form.Field name="name" validators={{
                onChange: ({value}) => {
                    return value.trim() === "" ? "Name is required.": undefined
                }
            }}>
                {(field) => {
                    return(
                        <Field>
                            <FieldLabel htmlFor="name">Enter full name:</FieldLabel>
                            <Input
                                type="text"
                                id="name"
                                name="name"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <em>{field.state.meta.errors.join(", ")}</em>
                            )}
                        </Field>
                    )
                }}
            </form.Field>


            <form.Field name="email" validators={{  // Apply other validators in the future
                onChange: ({value}) => {
                    return (value.trim() === "" ? "Email is required.": undefined)
                }
            }}>
                {(field) => {
                    return(
                        <Field>
                            <FieldLabel htmlFor="email">Enter email:</FieldLabel>
                            <Input
                                type="text"
                                id="email"
                                name="email"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <em>{field.state.meta.errors.join(", ")}</em>
                            )}
                        </Field>
                    )
                }}
            </form.Field>


            <form.Field name="phone" validators={{
                onChange: ({value}) => {
                    // Put validators here
                }
            }}>
                {(field) => {
                    return(
                        <Field>
                            <FieldLabel htmlFor="phone">Enter phone #:</FieldLabel>
                            <Input
                                type="text"
                                id="phone"
                                name="phone"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <em>{field.state.meta.errors.join(", ")}</em>
                            )}
                        </Field>
                    )
                }}
            </form.Field>


            <form.Field name="role">
                {(field) => {
                    return(
                        <Field>
                            <FieldLabel>Enter email:</FieldLabel>
                            <Select items={role} defaultValue="">
                                <SelectTrigger id="role">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {role.map((r) => {
                                            return (
                                            <SelectItem key={r.value} value={r.value}>
                                                {r.label}
                                            </SelectItem>
                                        )})}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </Field>
                    )
                }}
            </form.Field>



            <form.Field name="street" validators={{
                onChange: ({value}) => {
                    // Put validators here
                }
            }}>
                {(field) => {
                    return(
                        <Field>
                            <FieldLabel htmlFor="street">Street Address:</FieldLabel>
                            <Input
                                type="text"
                                id="street"
                                name="street"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <em>{field.state.meta.errors.join(", ")}</em>
                            )}
                        </Field>
                    )
                }}
            </form.Field>
            <div className="flex flex-row gap-2">
                {addressInfo.map(({name, label}) => {
                    return (
                        <form.Field name={name} key={name}>
                            {(field) => {
                                return(
                                    <Field>
                                        <FieldLabel htmlFor={name}>{label}</FieldLabel>
                                        <Input
                                            type="text"
                                            id={name}
                                            name={name}
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                    </Field>
                                )
                            }}
                        </form.Field>
                    )
                })}
            </div>
            
            <div className="flex flex-row gap-3 justify-end">
            <DialogClose render= {<Button> Cancel </Button>}/>
            <DialogClose render={
                <Button
                type="submit"
                onClick={form.handleSubmit}
                >
                    Submit!
                </Button>
            }/>
            </div>
            
        </form>
    )
}