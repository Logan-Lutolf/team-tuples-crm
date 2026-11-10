import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, User, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { EditEmployeeForm } from "../forms/edit-employee-form"
import { Button } from "@/components/ui/button"
import { DeleteEmployeeForm } from "../forms/delete-form"
import { PageActionLink } from "@/components/records/page-action-link"
import type { Employee } from "./columns"




export function ActionsCell({employee}: {employee: Employee}) {
    const router = useRouter()
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
            return (
                /*
                    View profile will be a link to the employee's profile page using dynamic routes in Nextjs
                */
            <>
                <div className="flex flex-wrap items-center justify-center gap-2">
                <PageActionLink href={`/details/employees/${employee.id}`}>View details</PageActionLink>
                <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>Delete</Button>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={<Button variant="ghost" className="h-8 w-8 p-0" aria-label={`More actions for ${employee.name}`}>
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
                </div>

                {editOpen && (
                    <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogContent>
                            <EditEmployeeForm
                                name={employee.name}
                                email={employee.email}
                                roles={employee.roles}
                                phone={employee.phone ?? "N/a"}    
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
