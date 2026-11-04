'use client'
import { Button } from '@/components/ui/button'
export default function ProgramsError({ reset }: { reset: () => void }) {
    return <div className="m-4 grid gap-4 sm:m-10" role="alert"><h1 className="text-2xl font-semibold">Could not load programs</h1><p>Check your connection and try again.</p><Button className="w-fit" onClick={reset}>Try again</Button></div>
}
