'use client'

import { Button } from "@/components/ui/button"

export default function BranchesError({ reset }: { reset: () => void }) {
    return <div className="m-4 grid gap-4 sm:m-10" role="alert">
        <h1 className="text-2xl font-semibold">Could not load branches</h1>
        <p>Check the database connection and confirm that the database has been migrated to the current contract.</p>
        <Button className="w-fit" onClick={() => reset()}>Try again</Button>
    </div>
}
