import { db } from "@/prisma/db";
import { faker } from "@faker-js/faker";

// this enum is probs unnecessary; connect via prisma contract instead
enum Role {
    ADMIN = "ADMIN",
    WORKSHOPS_COORDINATOR = "WORKSHOPS_COORDINATOR",
    NEWSLETTER_COORDINATOR = "NEWSLETTER_COORDINATOR",
    SCHOOL_NETWORK_COORDINATOR = "SCHOOL_NETWORK_COORDINATOR",
    VETERANS_DAY_COORDINATOR = "VETERANS_DAY_COORDINATOR",
}

function generateRandomEmployees() {
    const values = Object.values(Role);
    const randomRole = values[Math.floor(Math.random() * values.length)];
    
    db.orm.public.Employee.create({
        address: {
            street: faker.location.street(),
            city: faker.location.city(),
            country: faker.location.country(),
            zipCode: faker.location.zipCode(),
        },
        name: faker.person.fullName(),
        email: faker.internet.email(),
        role: randomRole,
    })
}

for (let i = 0; i < 100; i++) {
    generateRandomEmployees();
}
