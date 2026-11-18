import { db } from "@/prisma/db";
import z from "zod";
import { EmployeeDetails } from "../employee-management/employee-details";

const studentSchema = z.object({
    name: z.string().min(1),
    dob: z.string(),
    school: z.string(),
})

const soonInstanceSchema = z.object({
    name: z.string().or(z.literal("")),
    coordinator: z.string().or(z.literal("")),
    students: z.array(studentSchema),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string().or(z.literal("")).optional()
})


export async function addSOONInstance(formData: FormData) {
    const parsed = soonInstanceSchema.safeParse(formData)
    if (!parsed.success) {
            const fieldErrors = z.flattenError(parsed.error).fieldErrors
            console.log("Form validaiton failed.")
            return { result: "error", message: `Invalid fields: ${Object.keys(fieldErrors).join(", ")}` }
    }
    const {name, coordinator, students, description, startDate, endDate } = parsed.data



    

    







    // try {
    //     // get employee id
    //     let empId: number = -1
    //     const employee = await db.orm.public.Person.include("employee").where({name: coordinator}).first()
    //     if (employee) empId = employee.id

    //     // Create students if they are not already in db
    //         // Create person
    //         // Create student

    //     // create new participation
    //     let participationId: number = -1
    //     const participation = await db.orm.public.Participation.create({
    //         name: name,
    //         startDate: startDate,
    //         endDate?: endDate,
    //         programType: "STORIES_OF_OUR_NEIGHBORS"
    //     })
    //     if (participation) participationId = participation.id


    //     // add participation and employee to join table
    //     const partEmp = await db.orm.public.ParticipationEmployees.create({
    //         particpationId: participationId,
    //         employeeId: empId
    //     })

    //     // add students to join table
    //     const partContact = await db.orm.public.ParticipationContacts.create({
    //         participationId: participationId,
    //         personId:

    //     })
    // }
    // catch (error) {

    // }



}