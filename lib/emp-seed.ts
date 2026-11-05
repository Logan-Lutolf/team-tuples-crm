import { db } from "@/prisma/db";
import { faker } from "@faker-js/faker";
import { Scalars } from "@prisma/orm-postgres/components";
import { Models } from "@/prisma/contract";

type Roles = Scalars<Models.public_Employee>["roles"];
type Role = Roles[number];

const ALL_ROLES = db.enums.public.Role.values as readonly Role[];

async function generateRandomEmployees() { 
    for (let i = 0; i < 100; i++) {
        await db.orm.public.Employee.create({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            password: faker.internet.password(),
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                zipCode: faker.location.zipCode(),
                country: faker.location.country(),
            },
            roles: faker.helpers.arrayElements(ALL_ROLES, {min: 0, max: 3}),
        });
    }
}

generateRandomEmployees()