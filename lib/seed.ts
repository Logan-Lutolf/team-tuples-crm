import { db } from "@/prisma/db";
import { faker } from "@faker-js/faker";

// these enums are probs unnecessary; connect via prisma contract instead
enum Role {
    ADMIN = "ADMIN",
    WORKSHOPS_COORDINATOR = "WORKSHOPS_COORDINATOR",
    NEWSLETTER_COORDINATOR = "NEWSLETTER_COORDINATOR",
    SCHOOL_NETWORK_COORDINATOR = "SCHOOL_NETWORK_COORDINATOR",
    VETERANS_DAY_COORDINATOR = "VETERANS_DAY_COORDINATOR",
}

enum Regions {
    ONE = "ONE",
    TWO = "TWO",
    THREE = "THREE",
    FOUR = "FOUR",
    FIVE = "FIVE",
    SIX = "SIX",
    SEVEN = "SEVEN",
    EIGHT = "EIGHT",
    NINE = "NINE",
    TEN = "TEN",
    ELEVEN = "ELEVEN",
    TWELVE = "TWELVE",
    THIRTEEN = "THIRTEEN",
    FOURTEEN = "FOURTEEN",
}

enum Types {
    PRIMARY = "PRIMARY",
    SECONDARY = "SECONDARY",
    UNDERGRADUATE = "UNDERGRADUATE",
    GRADUATE = "GRADUATE",
    POSTGRADUATE = "POSTGRADUATE",
}

enum Relationships {
    POOR = "POOR",
    AVERAGE = "AVERAGE",
    EXCELLENT = "EXCELLENT",
}

function generateRandomEmployee() {
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
        phone: faker.phone.number(),
        role: randomRole,
    })
}


function generateRandomContact() {
    const values = Object.values(Regions);
    const randomRegion = values[Math.floor(Math.random() * values.length)];
    
    db.orm.public.Contact.create({
        address: {
            street: faker.location.street(),
            city: faker.location.city(),
            country: faker.location.country(),
            zipCode: faker.location.zipCode(),
        },
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        region: randomRegion,
    })
}


function generateRandomSchool() {
    const regions = Object.values(Regions);
    const randomRegion = regions[Math.floor(Math.random() * regions.length)];

    const types = Object.values(Types);
    const randomType = types[Math.floor(Math.random() * types.length)];

    const relationships = Object.values(Relationships);
    const randomRelationship = relationships[Math.floor(Math.random() * relationships.length)];

    db.orm.public.School.create({
        address: {
            street: faker.location.street(),
            city: faker.location.city(),
            country: faker.location.country(),
            zipCode: faker.location.zipCode(),
        },
        name: faker.company.name(),
        region: randomRegion,
        relationship: randomRelationship,
        type: randomType,
    })        
}


for (let i = 0; i < 50; i++) {
    generateRandomEmployee();
    generateRandomContact();
    generateRandomSchool();
}