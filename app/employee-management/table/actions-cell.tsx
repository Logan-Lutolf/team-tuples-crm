import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, User, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { EditEmployeeForm } from "../forms/edit-employee-form"
import { Button } from "@/components/ui/button"
import { DeleteEmployeeForm } from "../forms/delete-form"
import { toast } from "@/components/ui/toast"

type Role = "ADMIN" | "WORKSHOPS_COORDINATOR" | "SCHOOL_NETWORK_COORDINATOR" | "STORIES_OF_OUR_NEIGHBORS_COORDINATOR" | "VETERANS_DAY_COORDINATOR" | "NEWSLETTER_COORDINATOR"


export function ActionsCell({employee}: {employee: { id: number, name: string, email: string, role: string, phone: string | null, globalRoles: string[]}}) {
    const router = useRouter()
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
            return (
                /*
                    View profile will be a link to the employee's profile page using dynamic routes in Nextjs
                */
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={<Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>}
                    />
                    <DropdownMenuContent>
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => setEditOpen(true)}
                            >
                                <Pencil/>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/details/employees/${employee.id}`)}>
                                <User/>
                                View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setDeleteOpen(true)}
                            >
                                <Trash color="var(--destructive)"/>
                                <span className="text-destructive">Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {editOpen && (
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogContent>
                            <EditEmployeeForm
                                name={employee.name}
                                email={employee.email}
                                id={employee.id}
                                globalRoles={employee.globalRoles}
                                phone={employee.phone ?? ""}
                                onSuccess={setEditOpen.bind(null, false)}
                            />
                        </DialogContent>
                    </Dialog>
                )}
                {deleteOpen && (
                    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                        <DialogContent>
                            <DeleteEmployeeForm
                                    employeeName={employee.name}
                                    onSuccess={setDeleteOpen.bind(null, false)}
                                    employeeId={employee.id}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </>
            )
}
