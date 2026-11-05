'use client'
import { PageActionLink } from '@/components/records/page-action-link'
import { PageContent, PageHeader, PageTitle, PageDescription } from '@/components/records/page-content'

import { useId, useState } from "react"
import { useFormStatus } from "react-dom"
import { Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
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
        <PageActionLink href="/branches">Cancel</PageActionLink>
        <Button type="submit" variant={deleting ? "destructive" : "default"} disabled={pending}>
            {pending ? "Saving…" : deleting ? "Delete branch" : "Save branch"}
        </Button>
    </div>
}

function Fields({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus()
    return <fieldset disabled={pending} className="grid gap-4">{children}</fieldset>
}

export function BranchFormPage({ branch, employees, names, regions, mode = "create" }: Props) {
    const [open, setOpen] = useState(true)
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
    return <PageContent open={open} backHref="/branches">

            <PageHeader>
                <PageTitle>{title}</PageTitle>
                <PageDescription>{deleting ? "Related schools and contacts are kept; their branch links are cleared automatically." : "Manage this branch’s region, institute, and chief."}</PageDescription>
            </PageHeader>
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
    </PageContent>
}
