"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/employee-management", label: "Employees" },
  { href: "/schools", label: "Schools" },
  { href: "/contacts", label: "Contacts" },
  { href: "/branches", label: "Branches" },
  { href: "/programs", label: "Programs" },
  { href: "/municipalities", label: "Municipalities" },
]

export function TopNavbar() {
  const pathname = usePathname()

  return (
    <nav aria-label="Dashboard navigation" className="flex shrink-0 flex-wrap gap-6 border-b px-6 pt-6">
      {links.map(({ href, label }) => {
        const detailType = href === "/employee-management" ? "employees" : href.slice(1)
        const active = pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`/details/${detailType}/`) || pathname === `/create/${detailType}`
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
