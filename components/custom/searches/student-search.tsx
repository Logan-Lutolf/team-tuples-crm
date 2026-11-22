"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { searchStudents } from "@/app/actions/student"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StudentResult } from "@/app/program-instances/forms/add-theatre-form"



type Result = StudentResult

interface StudentSearchProps {
    onAdd: (student: Result) => void
}

export function StudentSearch({ onAdd }: StudentSearchProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Result[]>([])
    const [selected, setSelected] = useState<Result | null>(null)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (selected && query === selected.name) return
        if (!query.trim()) { setResults([]); setOpen(false); return }
        const t = setTimeout(async () => {
            setResults(await searchStudents(query))
            setOpen(true)
        }, 250)
        return () => clearTimeout(t)
    }, [query, selected])

    function add() {
        if (!selected) return
        onAdd(selected)
        setSelected(null)
        setQuery("")
        setResults([])
        setOpen(false)
    }

    return (
        <div className="flex flex-row gap-2 w-full">
            <Button type="button" onClick={add} disabled={!selected}><Plus /></Button>
            <div className="relative w-full">
                <Input
                    type="text"
                    value={query}
                    placeholder="Search students..."
                    autoComplete="off"
                    onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                />

                {open && results.length > 0 && (
                    <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                        {results.map((r) => (
                            <li key={r.id}>
                                <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left hover:bg-accent"
                                    onClick={() => { setSelected(r); setQuery(r.name); setOpen(false) }}
                                >
                                    {r.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}