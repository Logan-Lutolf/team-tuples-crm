"use client"

import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "../../ui/navigation-menu"
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar"
import { HelpCircle, LogOut, Settings, SettingsIcon } from "lucide-react"
import { logout } from "@/app/actions/login"
import { useState } from "react"
import { Dialog, DialogTrigger } from "../../ui/dialog"
import { SettingsDialog } from "./settings-dialog"
import { nameInitials } from "@/lib/utils"
import { Employee, Person } from "@/app/types"
import { canUseEmailContacts } from '@/lib/email-contacts'
import { TopNavbarContainer } from "./top-navbar-container"
import Image from "next/image";


const links = [
  { href: "/employee-management", label: "Employees" },
  { href: "/dashboard", label: "Dashboard"}
]

const searchlinks = [
  { href: "/schools", label: "Organizations" },
  { href: "/contacts", label: "Contacts" },
  { href: "/branches", label: "Branches" },
  { href: "/programs", label: "Programs" },
  { href: "/municipalities", label: "Municipalities" }
]


interface TopNavbarProps {
  employee: Employee
  person: Person
}

export function TopNavbar({employee, person}: TopNavbarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="flex flex-row justify-between">
      <Image src={"/image.png"} alt={"Post Bellum Logo"} width={300} height={10}/>

    <NavigationMenu orientation="horizontal" className="mt-2">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="/dashboard">Dashboard</NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="cursor-pointer">Searches</NavigationMenuTrigger>
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
          <NavigationMenuLink href="/program-instances">Participations</NavigationMenuLink>
        </NavigationMenuItem>

        {canUseEmailContacts(employee.role) && <NavigationMenuItem>
          <NavigationMenuLink href="/email">Emailing</NavigationMenuLink>
        </NavigationMenuItem>}

        <NavigationMenuItem>
          <NavigationMenuTrigger className="cursor-pointer">
            <Avatar>
              <AvatarImage src={employee.pfpImgUrl} alt="" height="auto" width="auto" />
              <AvatarFallback>{nameInitials(person.name)}</AvatarFallback>
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
      <SettingsDialog employee={employee} person={person}/>
    </Dialog>
    </div>
  )
}
