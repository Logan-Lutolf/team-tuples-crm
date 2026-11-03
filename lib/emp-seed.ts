import { db } from "@/prisma/db";
import { faker } from "@faker-js/faker";


async function generateRandomEmployees() { 
    for (let i = 0; i < 100; i++) {
        await db.orm.public.Employee.create({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                zipCode: faker.location.zipCode(),
                country: faker.location.country(),
            },
            role: faker.helpers.arrayElement(db.enums.public.Role.values),
        });
    }
}

generateRandomEmployees()