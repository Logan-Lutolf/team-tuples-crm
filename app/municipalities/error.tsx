'use client'
import { Button } from '@/components/ui/button'
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="m-10 grid gap-4" role="alert"><h1>Could not load municipalities</h1><Button className="w-fit" onClick={reset}>Try again</Button></div> }
