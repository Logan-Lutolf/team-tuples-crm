// Written by claude

"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { searchEmployees } from "@/app/actions/employee"   // wherever you put it

type Result = { id: number; name: string }

export function CoordinatorSearch({ form }: { form?: string }) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Result[]>([])
    const [selected, setSelected] = useState<Result | null>(null)
    const [open, setOpen] = useState(false)

    // Debounce: wait 250ms after the last keystroke before querying
    useEffect(() => {
        if (selected && query === selected.name) return   // just picked one, don't re-search
        const t = setTimeout(async () => {
            setResults(await searchEmployees(query))
            setOpen(true)
        }, 250)
        return () => clearTimeout(t)
    }, [query, selected])

    return (
        <div className="relative w-full">
            <Input
                type="text"
                value={query}
                placeholder="Search employees..."
                autoComplete="off"
                onChange={e => { setQuery(e.target.value); setSelected(null) }}
                onBlur={() => setTimeout(() => setOpen(false), 150)}  // lets the click on an item land first
            />

            {/* This is what the form actually submits */}
            <input type="hidden" name="coordinator-id" value={selected?.id ?? ""} form={form} />

            {open && results.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    {results.map(r => (
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
    )
}