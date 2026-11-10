"use client"

import { useActionState } from "react";
import { login } from "./actions";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LoginForm() {
    const [state, loginAction] = useActionState(login, undefined);

    return (
        <Card className="flex flex-col justify-start w-1/3 h-full">
            <CardContent>
                <CardTitle>Login</CardTitle>
                <form action={loginAction} className="flex flex-col gap-2">
                    {state === "Email or password is incorrect." && <span className="text-destructive">Email or password is incorrect.</span>}
                    <Field>
                    <FieldLabel>Enter email:</FieldLabel>
                    <Input type="email" name="email" required/>
                    </Field>

                    <Field>
                        <FieldLabel>Enter password:</FieldLabel>
                        <Input type="password" name="password" required/>
                    </Field>

                    <Button type="submit">Submit</Button>
                </form>
            </CardContent>
        </Card>
    );
}
