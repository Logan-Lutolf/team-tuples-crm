"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "./ui/navigation-menu"
import { Avatar } from "./ui/avatar"
import { HelpCircle, LogOut, Settings } from "lucide-react"
import { Separator } from "@base-ui/react"
import { logout } from "@/app/login/actions"


const links = [
  { href: "/employee-management", label: "Employees" },
  { href: "/dashboard", label: "Dashboard"}
]

const searchlinks = [
  { href: "/schools", label: "Schools" },
  { href: "/contacts", label: "Contacts" },
  { href: "/branches", label: "Branches" },
  { href: "/programs", label: "Programs" },
  { href: "/municipalities", label: "Municipalities" }
]

export function TopNavbar() {
  const pathname = usePathname()

  return (
    <NavigationMenu orientation="horizontal">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="/dashboard">Dashboard</NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Searches</NavigationMenuTrigger>
          <NavigationMenuContent>
            {searchlinks.map((link) => {
              return (
                <NavigationMenuLink href={link.href} key={link.label}>{link.label}</NavigationMenuLink>
              )
            })}
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink href="/employee-management">Employees</NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <Avatar/>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink className="flex flex-row gap-2">
              <HelpCircle/>
              Help
            </NavigationMenuLink>
            <NavigationMenuLink className="flex flex-row gap-2">
              <Settings/>
              Settings
            </NavigationMenuLink>
            <NavigationMenuLink onClick={logout} className="flex flex-row gap-2">
              <LogOut/>
              Logout
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
