"use client"

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthControls } from "@/components/auth-controls";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NotebookPen} from "lucide-react"

const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Profile" }
];

export function Navbar() {
    const pathname = usePathname();

    return (
        <header className="justify-center">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
                <Link href="/dashboard">
                    <NotebookPen />
                </Link>
                <nav className="flex gap-6">
                    {links.map(({href, label }) => {
                        const active = pathname === href || (href === "/dashboard" && pathname.startsWith("/blog"));
                        return (
                            <Link key={href} href={href} className={ active ? "text-black" : "text-gray-500"}>
                                {label}
                            </Link>
                        )
                    })}
                </nav>
                <Suspense fallback={<Button type="button" variant="outline" disabled aria-busy="true">Loading…</Button>}>
                    <AuthControls />
                </Suspense>
            </div>
        </header>
    )
}