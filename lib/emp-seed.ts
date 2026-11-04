import { db } from "@/prisma/db";
import { faker } from "@faker-js/faker";


async function generateRandomEmployees() { 
    for (let i = 0; i < 100; i++) {
        await db.transaction(async tx => {
        const employee = await tx.orm.public.Employee.create({
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                zipCode: faker.location.zipCode(),
                country: faker.location.country(),
            },

        });
        await tx.orm.public.EmployeeAssignment.create({ employeeId: employee.id, role: faker.helpers.arrayElement(db.enums.public.EmployeeJobRole.values) });
        });
    }
}

generateRandomEmployees()