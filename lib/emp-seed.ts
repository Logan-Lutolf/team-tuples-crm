import "temporal-polyfill/global";
import { db } from "@/prisma/db";
import { faker } from "@faker-js/faker";
import { Temporal } from "temporal-polyfill";




async function generateRandomEmployees() { 
    for (let i = 0; i < 100; i++) {
        const birth = faker.date.birthdate({ min: 18, max: 65, mode: "age" });
        const employee = await db.orm.public.Person.create({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                zipCode: faker.location.zipCode(),
                country: faker.location.country(),
            },
            dob: Temporal.PlainDate.from({
                year: birth.getUTCFullYear(),
                month: birth.getUTCMonth() + 1,
                day: birth.getUTCDate(),
            }),
        })
    }
}

async function generateOrganizations() {
    for (let i = 0; i < 5; i++) {
        const org = await db.orm.public.Organization.create({
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                zipCode: faker.location.zipCode(),
                country: faker.location.country(),
            },
            branch: "PRAHA",
            name: "Organization " + i,
            region: "PRAHA",
            relationship: "EXCELLENT",
            type: "PRIMARY_SCHOOL"
        })
    }
}

// generateRandomEmployees()

generateOrganizations()