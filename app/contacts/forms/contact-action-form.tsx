'use client'

import { useState, type ComponentProps } from "react"
import { useFormStatus } from "react-dom"

export type ContactActionResult = { success: true } | { error: string }
export type ContactFormAction = (data: FormData) => Promise<ContactActionResult>

function FormFields({ children }: { children: React.ReactNode }) {
    const { pending } = useFormStatus()
    return <fieldset disabled={pending} className="contents">{children}</fieldset>
}

export function ContactActionForm({ action, children, ...props }: Omit<ComponentProps<"form">, "action"> & {
    action: ContactFormAction
}) {
    const [message, setMessage] = useState<ContactActionResult | null>(null)
    async function submit(data: FormData) {
        setMessage(null)
        try {
            setMessage(await action(data))
        } catch {
            setMessage({ error: "Could not submit the form. Check your connection and try again." })
        }
    }
    return (
        <form {...props} action={submit}>
            <FormFields>{children}</FormFields>
            {message && ("error" in message
                ? <p role="alert" className="text-destructive">{message.error}</p>
                : <p role="status">Changes saved.</p>)}
        </form>
    )
}
