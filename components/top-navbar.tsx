"use client"

import { usePathname } from "next/navigation"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "./ui/navigation-menu"
import { Avatar, AvatarImage } from "./ui/avatar"
import { HelpCircle, LogOut, Settings } from "lucide-react"
import { logout } from "@/app/login/actions"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"

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

type Employee = Scalars<Models.public_Employee>

interface TopNavbarProps {
  employee: Employee
}

export function TopNavbar({employee}: TopNavbarProps) {
  const pathname = usePathname()

  return (
    <NavigationMenu orientation="horizontal" className="mt-2">
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
            <Avatar>
              <AvatarImage src={employee.pfpImgUrl} alt="CL" height="auto" width="auto" />
            </Avatar>
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
