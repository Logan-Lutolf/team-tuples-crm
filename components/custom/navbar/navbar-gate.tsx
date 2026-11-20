// Written by Claude yet again... time is of the essence :(
"use client"

import { usePathname } from "next/navigation"

const HIDDEN_ON = ["/login", "/otp-page"]

export function NavbarGate({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    if (HIDDEN_ON.some(p => pathname === p || pathname.startsWith(p + "/"))) return null
    return <>{children}</>
}