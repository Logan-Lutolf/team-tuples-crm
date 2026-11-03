"use client"

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// import this after CL makes auth-controls (sign-in/sign-out button)
// import { AuthControls } from "@/app/components/auth-controls";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { NotebookPen} from "lucide-react";

const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/map", label: "Map" },
    { href: "/profile", label: "Profile" },
];

export function Navbar() {
    const pathname = usePathname();

    return (
        <header className="h-screen w-40 shrink-0 border-r p-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/dashboard">
                    <NotebookPen />
                </Link>
                <nav className="flex flex-col gap-6 absolute top-1/2 -translate-y-1/2 ">
                    {links.map(({href, label }) => {
                        const active = pathname === href || pathname.startsWith(`${href}/`);
                        return (
                            <Link key={href} href={href} className={active ? "font-bold" : ""}>
                                {label}
                            </Link>
                        )
                    })}
                </nav>
                <Suspense fallback={<Button type="button" variant="outline" disabled aria-busy="true">Loading…</Button>}>
                    {/* <AuthControls /> */}
                </Suspense>
            </div>
        </header>
    )
}
