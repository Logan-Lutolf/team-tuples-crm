import { db } from "@/prisma/db"
import {SHA256} from "jscrypto/es6/SHA256"




export async function attemptLogin(formData: FormData) {
    const email = formData.get("email") as string
    const password = SHA256.hash(formData.get("password") as string)

    try {
        const employee = await db.orm.public.Employee
                            .where({
                                email: email,
                                password: password
                            })
                            .first()

    }
    catch (error) {
        console.log("Username or password is incorrect.")
    }
}