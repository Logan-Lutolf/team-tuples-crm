'use client'
import { PageContent, PageHeader, PageTitle, PageDescription } from '@/components/records/page-content'

import { useEffect, useState, type ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { SchoolDetails } from './school-details'
import { getSchoolDetails } from './actions_schools'

type Details = ComponentProps<typeof SchoolDetails>
export function SchoolDetailsPage({ schoolId, schoolName, initialDetails }: { schoolId: number; schoolName: string; initialDetails?: Details }) {
    const [details, setDetails] = useState<Details | null>(initialDetails ?? null)
    const [error, setError] = useState(false)
    const [revision, setRevision] = useState(0)
    useEffect(() => {
        if (initialDetails && revision === 0) return
        let active = true
        setDetails(null)
        setError(false)
        getSchoolDetails(schoolId, false, true).then(data => { if (active) setDetails(data) })
            .catch(() => { if (active) setError(true) })
        return () => { active = false }
    }, [schoolId, revision, initialDetails])
    return <PageContent backHref="/schools">

            {details ? <SchoolDetails {...details} onDetailsRefresh={() => setRevision(r => r + 1)} /> : <>
                <PageHeader><PageTitle>{schoolName}</PageTitle></PageHeader>
                {error ? <div role="alert">Could not load school details. <Button variant="outline" onClick={() => setRevision(r => r + 1)}>Try again</Button></div> : <p role="status">Loading school details…</p>}
            </>}
    </PageContent>
}
