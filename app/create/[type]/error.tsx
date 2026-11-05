'use client'
import { Button } from '@/components/ui/button'
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="m-10 grid gap-4" role="alert"><p>Could not load the creation form.</p><Button className="w-fit" onClick={reset}>Try again</Button></div> }
