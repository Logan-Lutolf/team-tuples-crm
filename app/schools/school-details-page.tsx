'use client'
import { PageContent, PageHeader, PageTitle, PageDescription } from '@/components/records/page-content'

import { useEffect, useState, type ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { SchoolDetails } from './school-details'
import { getSchoolDetails } from './actions_schools'

type Details = ComponentProps<typeof SchoolDetails>
export function SchoolDetailsPage({ schoolId, schoolName }: { schoolId: number; schoolName: string }) {
    const [details, setDetails] = useState<Details | null>(null)
    const [error, setError] = useState(false)
    const [revision, setRevision] = useState(0)
    useEffect(() => {
        let active = true
        setDetails(null)
        setError(false)
        getSchoolDetails(schoolId).then(data => { if (active) setDetails(data) })
            .catch(() => { if (active) setError(true) })
        return () => { active = false }
    }, [schoolId, revision])
    return <PageContent backHref="/schools">

            {details ? <SchoolDetails {...details} onDetailsRefresh={() => setRevision(r => r + 1)} /> : <>
                <PageHeader><PageTitle>{schoolName}</PageTitle></PageHeader>
                {error ? <div role="alert">Could not load school details. <Button variant="outline" onClick={() => setRevision(r => r + 1)}>Try again</Button></div> : <p role="status">Loading school details…</p>}
            </>}
    </PageContent>
}
