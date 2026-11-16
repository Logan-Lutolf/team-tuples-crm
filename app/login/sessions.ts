import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { type RoleTypes } from "../types"




const secretKey = process.env.SECRET_KEY
const encodedKey = new TextEncoder().encode(secretKey)

if (!secretKey) throw new Error("SECRET_KEY is not set")

export async function createSession(userId: number, userRoles: RoleTypes) {
    const expiresAt = new Date(Date.now() + 7 * 24 *60 *60 * 1000)
    const mustChangePassword = true
    const session = await encrypt({userId, expiresAt, userRoles, mustChangePassword});
    

    const cookieStore = await cookies()
    cookieStore.set("session", session, {
        httpOnly: true,
        secure: true,
        expires: expiresAt
    })

    // Create cookie using session
    // (await cookies()).set("session", session, {
    //     httpOnly: true,
    //     secure: true,
    //     expires: expiresAt
    // })
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete("session")
}



type SessionPayload = {
    userId: number,
    expiresAt: Date
    userRoles: RoleTypes
    mustChangePassword: boolean
}

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({alg: "HS256"})
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(encodedKey)
}

export async function decrypt(session: string | undefined) {
    if (!session) return undefined
    try {
        const { payload } = await jwtVerify<SessionPayload>(session, encodedKey, {
            algorithms: ["HS256"],
        });

        return payload;
    } 
    catch (error) {
        console.log("Failed to verify session: ", error);
        return undefined
    }
}