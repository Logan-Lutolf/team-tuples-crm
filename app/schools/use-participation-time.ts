'use client'
import { useEffect, useState } from 'react'

export function useParticipationTime(initialTime: number) {
    const [now, setNow] = useState(initialTime)
    useEffect(() => {
        setNow(Date.now())
        const timer = setInterval(() => setNow(Date.now()), 30_000)
        return () => clearInterval(timer)
    }, [initialTime])
    return now
}
