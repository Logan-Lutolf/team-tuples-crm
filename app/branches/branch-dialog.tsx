'use client'

import { useId, useState } from "react"
import { useFormStatus } from "react-dom"
import { Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBranch, editBranch, deleteBranch } from "./actions"
import type { Branch, BranchResult, EmployeeOption } from "./branch-data"

type Props = {
    branch?: Branch
    employees: EmployeeOption[]
    names: Branch["name"][]
    regions: Branch["region"][]
    mode?: "create" | "edit" | "delete"
}

function FormButtons({ deleting }: { deleting: boolean }) {
    const { pending } = useFormStatus()
    return <div className="flex justify-end gap-3 pt-2">
        <DialogClose render={<Button type="button" variant="outline" disabled={pending}>Cancel</Button>} />
        <Button type="submit" variant={deleting ? "destructive" : "default"} disabled={pending}>
            {pending ? "Saving…" : deleting ? "Delete branch" : "Save branch"}
        </Button>
    </div>
}

function Fields({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus()
    return <fieldset disabled={pending} className="grid gap-4">{children}</fieldset>
}

export function BranchDialog({ branch, employees, names, regions, mode = "create" }: Props) {
    const [open, setOpen] = useState(false)
    const [result, setResult] = useState<BranchResult | null>(null)
    const prefix = useId()
    const deleting = mode === "delete"
    const title = mode === "create" ? "Add a Branch" : deleting ? `Delete branch ${branch?.name}` : `Edit branch ${branch?.name}`
    async function submit(form: FormData) {
        setResult(null)
        try {
            const next = await (mode === "create" ? createBranch : deleting ? deleteBranch : editBranch)(form)
            setResult(next)
            if ("success" in next) setOpen(false)
        } catch {
            setResult({ error: "Could not submit the form. Check your connection and try again." })
        }
    }
    function select(field: string, label: string, options: { value: string; label: string }[], value: string, required = true) {
        return <Field>
            <FieldLabel htmlFor={`${prefix}-${field}`}>{label}</FieldLabel>
            <Select name={field} items={options} defaultValue={value} required={required}>
                <SelectTrigger id={`${prefix}-${field}`} className="w-full"><SelectValue placeholder={`Choose ${label.toLowerCase()}`} /></SelectTrigger>
                <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
        </Field>
    }
    return <Dialog open={open} onOpenChange={(value) => { setOpen(value); setResult(null) }}>
        <DialogTrigger render={<Button variant={deleting ? "destructive" : mode === "edit" ? "outline" : "default"} aria-label={title} />}>
            {mode === "create" ? title : deleting ? <Trash className="size-4" /> : <Pencil className="size-4" />}
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{deleting ? "Linked schools, contacts, and assignments must be reassigned before deletion." : "Manage this branch’s region, institute, and chief."}</DialogDescription>
            </DialogHeader>
            <form action={submit} className="grid gap-4">
                <Fields>
                    {branch && <input type="hidden" name="id" value={branch.id} />}
                    {deleting ? <Field>
                        <FieldLabel htmlFor={`${prefix}-confirmation`}>Type delete to confirm</FieldLabel>
                        <Input id={`${prefix}-confirmation`} name="confirmation" required pattern="delete" autoComplete="off" />
                    </Field> : <>
                        {select("name", "Name", names.map((value) => ({ value, label: value })), branch?.name ?? "")}
                        {select("region", "Region", regions.map((value) => ({ value, label: value })), branch?.region ?? "")}
                        <Field>
                            <FieldLabel htmlFor={`${prefix}-institute`}>Institute (optional)</FieldLabel>
                            <Input id={`${prefix}-institute`} name="institute" defaultValue={branch?.institute ?? ""} />
                        </Field>
                        {select("chiefId", "Chief (optional)", [{ value: "", label: "No chief" }, ...employees.map((employee) => ({ value: String(employee.id), label: `${employee.name} (${employee.email})` }))], branch?.chiefId ? String(branch.chiefId) : "", false)}
                        {!employees.length && <p className="text-sm text-muted-foreground">Add employees on the Employees page to assign a chief.</p>}
                    </>}
                </Fields>
                {result && "error" in result && <p role="alert" className="text-destructive">{result.error}</p>}
                <FormButtons deleting={deleting} />
            </form>
        </DialogContent>
    </Dialog>
}
