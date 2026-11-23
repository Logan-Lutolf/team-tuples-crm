'use server'

import { refresh } from "next/cache"
import { db } from "@/prisma/db"
import z from 'zod'
import { BRANCH_TYPES, REGION_TYPES } from '../types'

// Zod schema for branches
const branchSchema = z.object({
    name: z.enum(BRANCH_TYPES),
    institute: z.string().or(z.literal("")).optional(),
    chiefId: z.number().or(z.literal(-1)).optional(),
    region: z.enum(REGION_TYPES)
})

const branchUpdateSchema = branchSchema.partial()

export async function updateBranch(formData: FormData, id: number) {
    const parsed = branchUpdateSchema.safeParse(Object.fromEntries(formData))
    
    if (!parsed.data) return {result: "error", message: "Branch update failed."}
    const {...scalars } = parsed.data

    try {
        const branch = await db.orm.public.Organization.where({id: id}).update(scalars)
        
        if (branch) return {result: "success", message: "Branch updated successfully."}
        else return {result: "error", message: "Branch update failed."}
    }   
    catch (error) {
        console.log(error)
        return {result: "error", message: "Branch update failed: " + error} 
    }
}


export async function createBranch(formData: FormData) {
    // Parse formData into zod schema
    const parsed = branchSchema.safeParse(Object.fromEntries(formData))

    // Check if parsing was successful
    if (!parsed.data) return {result: "error", message: "Branch creation failed: Invalid inputs."}

    // Deconstruct data object
    const {...scalars} = parsed.data

    // Add to database
    try {
        const branch = await db.orm.public.Branch.create(scalars)
        
        if (!branch) return {result: "Error", message: "Branch creation failed."}
        else {
            refresh()
            return {result: "Success", message: "Branch creation successful."}
        }
    }
    catch (error) {
        return {result: "Error", message: "Branch creation failed: " + error}
    }
}


export async function deleteBranch(branchId: number) {
    try {
        const branch = db.orm.public.Branch.where({id: branchId}).delete()
        if (!branch) return {result: "Error", message: "Branch deletion failed."}
        else {
            refresh()
            return {result: "Success", message: "Branch deletion successful."}
        }
    }
    catch (error) {
        console.log(error)
        return {result: "Error", message: "Branch deletion failed: " + error}
    }
} 

export async function getBranches(query?: string) {
    try {
        const pattern = `%${query?.replace(/[\\%_]/g, "\\$&")}%`
        const branchQuery = query
            ? db.orm.public.Branch.where((b) => b.name.ilike(pattern)).all().toArray()
            : db.orm.public.Person.all().toArray()

        const branches = await branchQuery
            
        branches.filter((b) => b.name.toLowerCase().includes(query ?? ""))
        
        return branchUpdateSchema
    }
    catch (error) {
        console.log(error)
    }


}