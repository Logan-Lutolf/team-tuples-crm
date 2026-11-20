// Written by Claude

"use client"

import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { searchOrganizations } from "@/app/actions/organization"

type Result = { id: number; name: string }

interface OrganizationSearchProps {
    form?: string,
    newOrg?: string,
    setNewOrg?: Dispatch<SetStateAction<string>>
}

export function OrganizationSearch({ form, newOrg, setNewOrg }: OrganizationSearchProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Result[]>([])
    const [selected, setSelected] = useState<Result | null>(null)
    const [open, setOpen] = useState(false)

    // Debounce: wait 250ms after the last keystroke before querying
    useEffect(() => {
        if (selected && query === selected.name) return   // just picked one, don't re-search
        const t = setTimeout(async () => {
            setResults(await searchOrganizations(query))
            setOpen(true)
        }, 250)
        return () => clearTimeout(t)
    }, [query, selected])

    return (
        <div className="relative w-full">
            <Input
                type="text"
                value={query}
                placeholder="Search organizations..."
                autoComplete="off"
                onChange={e => {
                setQuery(e.target.value)
                setSelected(null)
                setNewOrg?.("")              // typing invalidates the previous selection
            }}
                onBlur={() => setTimeout(() => setOpen(false), 150)}  // lets the click on an item land first
            />

            {/* This is what the form actually submits */}
            <input type="hidden" name="org" value={selected?.id ?? -1} form={form} />

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