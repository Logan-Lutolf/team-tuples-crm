import Image from "next/image"
import { LoginForm } from "./login-form"

export default function LoginPage() {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Left: image */}
            <div className="relative">
                <Image
                    src="/peace-sign.png"
                    alt=""
                    fill
                    priority
                    className="object-fit absolute left-10"
                />
            </div>

            {/* Right: form */}
            <div className="flex items-center justify-center p-8">
                <div className="w-full max-w-sm">
                    <LoginForm />
                </div>
            </div>
        </div>
    )
}