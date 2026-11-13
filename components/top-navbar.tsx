"use client"

import { usePathname } from "next/navigation"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "./ui/navigation-menu"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { HelpCircle, LogOut, Settings, SettingsIcon } from "lucide-react"
import { logout } from "@/app/login/actions"
import { Scalars } from "@prisma/orm-postgres/components"
import { Models } from "@/prisma/contract"
import { useState } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogTrigger } from "./ui/dialog"
import { SettingsDialog } from "./custom/pfp-dialog"
import { nameInitials } from "@/lib/utils"

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
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
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
          <NavigationMenuLink href="/email">Email</NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="cursor-pointer">
            <Avatar>
              <AvatarImage src={employee.pfpImgUrl} alt="" height="auto" width="auto" />
              <AvatarFallback>{nameInitials(employee.name)}</AvatarFallback>
            </Avatar>
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink className="flex flex-row gap-2 cursor-pointer">
              <HelpCircle/>
              Help
            </NavigationMenuLink>
            <NavigationMenuLink 
              onClick={() => setSettingsOpen(true)}
              className="flex flex-row gap-2 cursor-pointer"
            >
              <SettingsIcon/>
              Settings
            </NavigationMenuLink>
            <NavigationMenuLink onClick={logout} className="flex flex-row gap-2 cursor-pointer">
              <LogOut/>
              Logout
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
    
    <Dialog open={settingsOpen} onOpenChange={() => setSettingsOpen(false)}>
      <SettingsDialog employee={employee}/>
    </Dialog>
    </>
  )
}
