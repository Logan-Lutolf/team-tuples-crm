'use client'

import { Input } from "../ui/input"
import { Field, FieldLabel } from "../ui/field"
import { useSearchParams, usePathname, useRouter } from "next/navigation"


export function Search({placeholder}: {placeholder: string}) {
    
    const searchParams = useSearchParams()
    const pathName = usePathname()
    const { replace } = useRouter()

    function handleSearch(term: string) {
        const params = new URLSearchParams(searchParams)
        params.delete('cursor')
        params.delete('dir')

        if (term) params.set('search', term)
        else params.delete('search')

        replace(`${pathName}?${params.toString()}`)
    }

    return (
        <Field orientation="horizontal" className="*:data-[slot=field-label]:flex-none">
            <FieldLabel htmlFor="search" className="whitespace-nowrap">Search Database</FieldLabel>

            <Input
                id="search"
                className="min-w-0 flex-1"
                type="search"
                placeholder={placeholder}
                onChange={(e) => handleSearch(e.target.value)}
            />
        </Field>
    )
}
