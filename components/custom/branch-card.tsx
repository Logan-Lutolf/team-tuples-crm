
// Wanted to make my own component for this <3

import { camelCaseIt } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import Image from "next/image"
import Link from "next/link"

interface BranchCardProps {
    name: string,
    imgUrl: string
    id: number
}

export function BranchCard({name, imgUrl, id}: BranchCardProps) {
    const link = `/details/branches/${id}`
    
    return (
        <div className="bg-background flex flex-col rounded-3xl overflow-hidden object-cover w-72 h-64 shadow-2xs hover:-translate-x-2 hover:-translate-y-2 transition cursor-pointer">
            <Link href={link} className="rounded-t-3xl h-4/5 object-cover">
                <img src={imgUrl} alt={name} className="h-full w-full object-cover"/>
            </Link>
            <div className="h-1/5 place-items-center py-3">
                <p className="text-base">{camelCaseIt(name)}</p>
            </div>
        </div>
    )
}

