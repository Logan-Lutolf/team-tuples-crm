'use server'
import { db } from "@/prisma/db"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"

type Role = Scalars<Models.public_Employee>["role"]

type NewEmployeeInput = {
    name: string
    email: string
    phone: string
    role: Role
}

export async function postEmployee(input: NewEmployeeInput) {
    // Add authetication
    // Needs fixing up
    try {
        const employee = await db.orm.public.Employee.create({
            name: input.name,
            email: input.email,
            phone: input.phone,
            role: input.role,
            address: {
                street: "",
                city: "",
                country: "",
                zipCode: "",
            },
        })

    }
    catch (error) {
        console.log("Creation failed: ", error)
        return("Failed to create new employee.")
    }
}