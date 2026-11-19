// app/login/layout.tsx
export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Left: branding / image panel */}
            <div className="relative hidden bg-primary lg:flex items-center justify-center p-10 text-primary-foreground">
                <h1 className="text-4xl font-bold">Your App Name</h1>
                {/* or <Image src="/login-bg.jpg" alt="" fill className="object-cover" /> */}
            </div>

            {/* Right: the page (your form) */}
            <div className="flex items-center justify-center p-8 bg-primary">
                <div className="w-full max-w-sm bg-primary">{children}</div>
            </div>
        </div>
    )
}