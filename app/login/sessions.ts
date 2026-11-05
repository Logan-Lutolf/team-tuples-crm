import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { Scalars } from "@prisma/orm-postgres/components";
import { Models } from "@/prisma/contract";
import { Session } from "inspector/promises";

type Roles = Scalars<Models.public_Employee>["roles"]


const secretKey = process.env.SECRET_KEY
const encodedKey = new TextEncoder().encode(secretKey)

export async function createSession(userId: number, userRoles: Roles) {
    const expiresAt = new Date(Date.now() + 7 * 24 *60 *60 * 1000)
    const session = await encrypt({userId, expiresAt, userRoles});

    // Create cookie using session
    (await cookies()).set("session", session, {
        httpOnly: true,
        secure: true,
        expires: expiresAt
    })
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete("session")
}



type SessionPayload = {
    userId: number,
    expiresAt: Date
    userRoles: Roles
}

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({alg: "HS256"})
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(encodedKey)
}

export async function decrypt(session: string | undefined = "") {
    try {
        const { payload } = await jwtVerify<SessionPayload>(session, encodedKey, {
            algorithms: ["HS256"],
        });

        return payload;
    } 
    catch (error) {
        console.log("Failed to verify session: ", error);
    }
}