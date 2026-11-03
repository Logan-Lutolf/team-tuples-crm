"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/employee-management", label: "Employees" },
  { href: "/schools", label: "Schools" },
  { href: "/contacts", label: "Contacts" },
]

export function TopNavbar() {
  const pathname = usePathname()

  return (
    <nav aria-label="Dashboard navigation" className="flex shrink-0 gap-6 border-b px-6 pt-6">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 border-transparent px-2 pb-3 hover:border-current${active ? " font-bold" : ""}`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
