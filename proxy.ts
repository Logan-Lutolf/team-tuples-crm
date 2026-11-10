// import { cookies } from "next/headers";
// import { NextRequest, NextResponse } from "next/server";
// import { decrypt } from "./login/sessions";

// const protectedRoutes = ["/dashboard", "/employee-management"];
// const publicRoutes = ["/login"];

// export default async function middleware(req: NextRequest) {
//     const path = req.nextUrl.pathname;
//     const isProtectedRoute = protectedRoutes.includes(path);
//     const isPublicRoute = publicRoutes.includes(path);

//     const cookieStore = await cookies()
//     const session = cookieStore.get("session")?.value;
//     const payload = await decrypt(session)

//     if (isProtectedRoute && !payload?.userId) {
//         return NextResponse.redirect(new URL("/login", req.nextUrl));
//     }

//     if (isPublicRoute && payload?.userId) {
//         return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
//     }

//     return NextResponse.next();
// }

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

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}