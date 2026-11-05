import Link from 'next/link'
export default function NotFound() {
    return <div className="m-10 grid gap-4"><h1 className="text-xl font-semibold">Record not found</h1><p>This record may have been deleted, or the link is invalid.</p><Link href="/schools" className="underline">Return to dashboard</Link></div>
}
