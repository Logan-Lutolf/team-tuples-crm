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
        <Card>
            <CardTitle>Login</CardTitle>
            <CardContent>
                <form action={loginAction} className="flex flex-col gap-2">
                    <Field>
                    <FieldLabel>Enter email:</FieldLabel>
                    <Input type="email" name="email" />
                    </Field>

                    <Field>
                        <FieldLabel>Enter password:</FieldLabel>
                        <Input type="password" name="password" />
                    </Field>

                    <Button type="submit">Submit</Button>
                </form>
            </CardContent>
        </Card>
    );
}
