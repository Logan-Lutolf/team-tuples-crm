import { db } from "@/prisma/db"
import { AddSchoolForm } from "./add-school-form"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Search } from "@/components/custom/search"

export default async function SchoolsPage({ searchParams }: {
    searchParams?: Promise<{ query?: string }>
}) {
    const params = await searchParams
    const query = params?.query?.trim().toLowerCase() ?? ""
    const orm = db.orm.public
    const [schools, branches, contacts, employees, programs] = await Promise.all([
        orm.School.all().toArray(),
        orm.Branch.all().toArray(),
        orm.Contact.where({ schoolId: null }).toArray(),
        orm.Employee.all().toArray(),
        orm.Program.all().toArray(),
    ])
    const enums = db.enums.public
    const visibleSchools = schools.filter((school) => school.name.toLowerCase().includes(query))

    return (
        <div className="m-10 flex flex-col gap-4">
            <Dialog>
                <DialogTrigger render={<Button>Add a School</Button>} />
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
                    <DialogTitle>Add a school</DialogTitle>
                    <AddSchoolForm
                        branches={branches.map(({ id, name, region }) => ({ id, name: `${name} (${region})` }))}
                        contacts={contacts.map(({ id, name, email, branchId }) => ({ id, name: `${name} (${email})`, branchId }))}
                        employees={employees.map(({ id, name, email }) => ({ id, name: `${name} (${email})` }))}
                        programs={programs.map(({ id, name }) => ({ id, name }))}
                        regions={[...enums.Region.values]}
                        types={[...enums.SchoolType.values]}
                        relationships={[...enums.RelationshipType.values]}
                        statuses={[...enums.ProgramStatus.values]}
                    />
                </DialogContent>
            </Dialog>
            <Search placeholder="Search schools" />
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead><tr>{["ID", "Name", "Email", "Type", "Region"].map((label) => <th key={label} className="p-2">{label}</th>)}</tr></thead>
                    <tbody>
                        {visibleSchools.map((school) => (
                            <tr key={school.id} className="border-t">
                                <td className="p-2">{school.id}</td>
                                <td className="p-2">{school.name}</td>
                                <td className="p-2">{school.email}</td>
                                <td className="p-2">{school.type}</td>
                                <td className="p-2">{school.region}</td>
                            </tr>
                        ))}
                        {visibleSchools.length === 0 && <tr><td colSpan={5} className="p-2">No schools found.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
