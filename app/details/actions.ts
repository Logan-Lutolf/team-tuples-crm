"use server"

import { unformatAddress } from "@/lib/utils"
import { db } from "@/prisma/db"
import { cookies } from "next/headers"
import { decrypt } from "../login/sessions"
import { refresh } from "next/cache"
import { BRANCH_TYPES, BranchTypes, REGION_TYPES, RegionTypes } from "../types"
import z from "zod"


export async function getUserRole() {
    const cookieStore = await cookies()
    const session = cookieStore.get("session")?.value
    const payload = await decrypt(session)
    return payload?.userRoles 
}






export async function updatePersonContactInfo(formData: FormData, id: number) {
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string
    const address = unformatAddress(formData.get("address") as string)

    try{
        const person = await db.orm.public.Person
            .where({id: id})
            .update({
                phone: phone,
                email: email,
                address: {
                    street: address.street,
                    city: address.city,
                    zipCode: address.zipCode,
                    country: address.country
                }
            })
        
        refresh()
        
        if (person) return {result: "success", message: "Contact update successful."}
        else return {result: "error", message: "Contact update failed."}
    }
    catch (error) {
        console.log(error)
        return {result: "error", message: "Contact update failed."}
    }

    
    
}

export async function updateOrganizationContactInfo(formData: FormData, id: number) {
    const phone = formData.get("phone") as string
    const email = formData.get("email") as string
    const address = unformatAddress(formData.get("address") as string)
    console.log(address)
    try{
        const organization = await db.orm.public.Organization
            .where({id: id})
            .update({
                    phone: phone,
                    email: email,
                    address: {
                        street: address.street,
                        city: address.city,
                        zipCode: address.zipCode,
                        country: address.country
                    }
            })

        console.log(organization)

        refresh()

        if (organization) return {result: "success", message: "Organization update successfull."}
        else return {result: "error", message: "Organization update failed."}
    }
    catch (error) {
        console.log(error)
        return {result: "error", message: "Organization update failed."}
    }
}

export async function updatePersonOtherInfo(formData: FormData, id: number) {
    const parsed = z.enum(BRANCH_TYPES).safeParse(formData.get("branch"))
    if (!parsed.success) {
        return { result: "error", message: "Please select a valid branch." }
    }

        try {
            const person = await db.orm.public.Person
                .where({id: id})
                .update ({
                    branchName: parsed.data,
                })

            if (person) {
                refresh()
                return {result: "success", message: "Updated person successfully."}
            } 
            else return {result: "error", message: "Update person failed."}
        }
        catch (error) {
            console.log(error)
            return {result: "Error", message: "" + error}
        }
}


export async function updateOrganizationOtherInfo(formData: FormData, id: number) {
    const parsed = z.object({
        region: z.enum(REGION_TYPES),
        branch: z.enum(BRANCH_TYPES),
    }).safeParse({
        region: formData.get("region"),
        branch: formData.get("branch"),
    })
    if (!parsed.success) {
        return { result: "error", message: "Please select a valid region and branch." }
    }


        try {
            // Update organization
            const organization = await db.orm.public.Organization
            .where({id: id})
            .update({
                branchName: parsed.data.branch,
                region: parsed.data.region,
            })
            
            if (organization) {
                refresh()
                return {result: "success", message: "Updated organization successfully."}
            } 
            else return {result: "error", message: "Update organization failed."}

            // Remove organization from branch (or does Prisma do this automatically?)
        }
        catch (error) {
            console.log(error)
            return {result: "Error", message: "" + error}
        }
    
}



