import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";




export default function LoginPage() {
    return (
        <div className="flex flex-col m-5">
            <Card>
                <CardTitle className="ml-5">Login</CardTitle>
                <CardContent>
                    <LoginForm/>
                </CardContent>
                <CardFooter>A footer for a disclaimer or something!</CardFooter>
            </Card>
        </div>
    )
}