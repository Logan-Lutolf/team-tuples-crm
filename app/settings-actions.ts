"use server"

import { db } from "@/prisma/db"

export async function changePFP(formData: FormData) {
    const file = formData.get("img")
    const empId = formData.get("employee-id")

    if (!(file instanceof File) || typeof empId !== "string" || file.size === 0)
        return { result: "error", message: "Failed to upload image." }

    if (!file.type.startsWith("image/"))
        return { result: "error", message: "File must be an image."}

    try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`

        await db.orm.public.Employee
            .where({ id: Number(empId) })
            .update({ pfpImgUrl: dataUrl })

        return { result: "success", message: "Profile picture updated." }
    } 
    catch (error) {
        console.log(error)
        return { result: "error", message: "Failed to upload image."}
    }
}