'use client'

import { useEffect, useRef } from "react"
import { Input } from "../ui/input"
import { Field, FieldLabel } from "../ui/field"
import { useSearchParams, usePathname, useRouter } from "next/navigation"


export function Search({placeholder}: {placeholder: string}) {
    
    const searchParams = useSearchParams()
    const pathName = usePathname()
    const { replace } = useRouter()
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [pathName, searchParams])

    function handleSearch(term: string) {
        const params = new URLSearchParams(searchParams)
        params.delete('cursor')
        params.delete('dir')
        params.delete('page')

        if (term) params.set('search', term)
        else params.delete('search')

        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => replace(`${pathName}?${params.toString()}`), 300)
    }

    return (
        <Field orientation="horizontal" className="*:data-[slot=field-label]:flex-none">
            <FieldLabel htmlFor="search" className="whitespace-nowrap">Search Database</FieldLabel>

            <Input
                id="search"
                className="min-w-0 flex-1"
                type="search"
                defaultValue={searchParams.get("search") ?? searchParams.get("query") ?? ""}
                placeholder={placeholder}
                onChange={(e) => handleSearch(e.target.value)}
            />
        </Field>
    )
}
