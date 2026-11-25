"use server"

import { z } from 'zod'
import { BRANCH_TYPES, ORG_TYPES, OrganizationTypes, REGION_TYPES, RELATIONSHIP_TYPES } from '../types'
import { db } from '@/prisma/db'
import { refresh } from 'next/cache'


const organizationSchema = z.object({
    name: z.string().min(1),
    phone: z.string().or(z.literal("")).optional(), // make this validation better
    email: z.email().or(z.literal("")).optional(),
    type: z.enum(ORG_TYPES),
    region: z.enum(REGION_TYPES),
    relationship: z.enum(RELATIONSHIP_TYPES),
    street: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    zipCode: z.string().min(1),
    branch: z.enum(BRANCH_TYPES).or(z.literal("")).optional()
})

const orgUpdateSchema = organizationSchema.partial()

export async function createOrganization(formData: FormData) {
    const parsedData = organizationSchema.safeParse(Object.fromEntries(formData))
    if (!parsedData.success) {
        const fieldErrors = z.flattenError(parsedData.error).fieldErrors
        console.log("Form validaiton failed.")
        return { result: "error", message: `Invalid fields: ${Object.keys(fieldErrors).join(", ")}` }
    }
    const data = parsedData.data
    
    
    try {
        const org = await db.orm.public.Organization.create({
            name: data?.name,
            phone: data?.phone,
            email: data?.email,
            type: data?.type,
            region: data?.region,
            relationship: data?.relationship,
            address: {
                street: data?.street,
                city: data?.city,
                country: data?.country,
                zipCode: data?.zipCode
            },
            branchName: data?.branch || null
        })

        if (org) return {result: "success", message: "Organization created successfully."}
        else return {result: "error", message: "Organization creation failed."}
    }
    catch (error) {
        console.log(error)
        return {result: "error", message: error}
    }
}


// Written by Claudy-poo
export async function searchOrganizations(query: string) {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []

    // Same pattern as your EmployeeTableContainer: load, then filter in JS.
    // If your ORM supports a case-insensitive "contains" filter, use it instead.
    const records = await db.orm.public.Organization.all().toArray()

    return records
        .filter(e => e.name.toLowerCase().includes(q))
        .slice(0, 8)
        .map(e => ({ id: e.id, name: e.name }))
}





export async function updateOrg(formData: FormData, id: number) {
    const parsed = orgUpdateSchema.safeParse(Object.fromEntries(formData))
    
    if (!parsed.data) return 
    const { branch, ...scalars } = parsed.data

    try {
        const org = await db.orm.public.Organization.where({id: id}).update(scalars)
        if (org) {refresh(); return {result: "success", message: "Organization updated successfully."};}
        else return {result: "error", message: "Organization update failed."}
    }   
    catch (error) {
        console.log(error)
        return {result: "error", message: "Organization update failed: " + error} 
    }
}


export async function getAllOrganizations() {
    try {
        const orgs = await db.orm.public.Organization.all().toArray()
        if(orgs) return orgs
        else return []
    }
    catch (error) {
        console.log(error)
    }
}