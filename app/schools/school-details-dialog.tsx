'use client'

import { useEffect, useState, type ComponentProps } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SchoolDetails } from './school-details'
import { getSchoolDetails } from './actions_schools'

type Details = ComponentProps<typeof SchoolDetails>
export function SchoolDetailsDialog({ schoolId, schoolName }: { schoolId: number; schoolName: string }) {
    const [open, setOpen] = useState(false)
    const [details, setDetails] = useState<Details | null>(null)
    const [error, setError] = useState(false)
    const [revision, setRevision] = useState(0)
    useEffect(() => {
        if (!open) return
        let active = true
        setDetails(null)
        setError(false)
        getSchoolDetails(schoolId).then(data => { if (active) setDetails(data) })
            .catch(() => { if (active) setError(true) })
        return () => { active = false }
    }, [open, schoolId, revision])
    return <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button aria-label={`View details for ${schoolName}`} />}><Eye /> View details</DialogTrigger>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[min(90vw,80rem)]">
            {details ? <SchoolDetails {...details} onDetailsRefresh={() => setRevision(r => r + 1)} /> : <>
                <DialogHeader><DialogTitle>{schoolName}</DialogTitle></DialogHeader>
                {error ? <div role="alert">Could not load school details. <Button variant="outline" onClick={() => setRevision(r => r + 1)}>Try again</Button></div> : <p role="status">Loading school details…</p>}
            </>}
        </DialogContent>
    </Dialog>
}
