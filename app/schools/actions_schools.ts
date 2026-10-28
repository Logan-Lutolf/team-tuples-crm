'use server'
import { db } from "@/prisma/db"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { revalidatePath } from "next/cache"

type SchoolFields = Scalars<Models.public_School>
type Region = SchoolFields["region"]
type SchoolType = SchoolFields["type"]
type Relationship = SchoolFields["relationship"]

// TODO: Only ADMIN should be able to create new employee

export async function createSchool(formData: FormData) {
    const name = formData.get("full-name") as string
    const type = formData.get("type") as SchoolType
    const phone = formData.get("phone-num") as string
    const email = formData.get("email") as string
    const relationship = formData.get("role") as Relationship
    const region = formData.get("region") as Region
    const branchId = Number(formData.get("branch"))
    
    if (name == null || email == null){
        console.log("Create employee failed: name or email is null")
        return
    }
    
    try {
        const employee = await db.orm.public.School.create({
            name: name,
            address: {
                street: formData.get("street") as string,
                city: formData.get("city") as string,
                zipCode: formData.get("zipCode") as string,
            },
            type: type,
            phone: phone,
            email: email, 
            relationship: relationship,
            region: region,
            branchId: branchId,
        })

        if(employee) {
            console.log("Create school successful.")
            revalidatePath("/employee-management")
        }
        
    }
    catch (error) {
        console.log("Create school failed: ", error)
    }
}

export async function editSchool(formData: FormData) {
    const name = formData.get("full-name") as string
    const type = formData.get("type") as SchoolType
    const phone = formData.get("phone-num") as string
    const email = formData.get("email") as string
    const relationship = formData.get("role") as Relationship
    const region = formData.get("region") as Region
    const branchId = Number(formData.get("branch"))


    if (name == null || email == null){
        console.log("Update school failed: name or email is null")
        return
    }

    try {
        const school = await db.orm.public.School
            .where({ email: email})
            .update({
                name: name,
                email: email,
                phone: phone,
                type: type,
                relationship: relationship,
                region: region,
                branchId: branchId,
                address: {
                    street: formData.get("street") as string,
                    city: formData.get("city") as string,
                    zipCode: formData.get("zipCode") as string,
                },
            })
        
        if (school) {
            console.log("Edit school successful.")
            revalidatePath("/school-management")
        }
    }
    catch (error) {
        console.log("Update employee faield: ", error)
    }

}

export async function deleteSchool(formData: FormData) {
    const id = formData.get('school-id')

    if (id == null) 
        console.log("Delete school failed: School ID does not exist.")

    const sch = Number(id)
    try {
        const deleted = await db.orm.public.School
            .where({id: sch})
            .delete()
        
        if (deleted)
            console.log("Deletion successful.")
            revalidatePath("/school-management")
    }
    catch (error) {
        console.log("Delete school failed: ", error)
    }
}