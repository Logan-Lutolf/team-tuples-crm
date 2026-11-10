import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/app/login/sessions"

const protectedPrefixes = [
  "/dashboard", "/employee-management",
  "/schools", "/contacts", "/branches", "/programs", "/municipalities",
]
const publicRoutes = ["/login"]

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p))
  const isPublic = publicRoutes.includes(path)

  const session = req.cookies.get("session")?.value
  const payload = await decrypt(session)

  if (isProtected && !payload?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }
  if (isPublic && payload?.userId) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }
  return NextResponse.next()
}