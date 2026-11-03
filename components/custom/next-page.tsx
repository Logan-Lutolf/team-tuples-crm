'use client'

import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { PaginationNext, PaginationPrevious} from "../ui/pagination"


function buildHref(searchParams: URLSearchParams, pathName: string, bookmark: string, dir: "next" | "prev") {
    const params = new URLSearchParams(searchParams.toString())
    params.set("cursor", bookmark)
    params.set("dir", dir)
    return `${pathName}?${params.toString()}`
}

export function NextPage({bookmark}: {bookmark: string}) {
    const searchParams = useSearchParams()
    const pathName = usePathname()
    


    return (
        <PaginationNext href={buildHref(searchParams, pathName, bookmark, "next")}/>
    )
}


export function PrevPage({bookmark}: {bookmark: string}) {
    const searchParams = useSearchParams()
    const pathName = usePathname()

    return (
        <PaginationPrevious href={buildHref(searchParams, pathName, bookmark, "prev")}/>
    )
}