

import { Field, FieldLabel } from "@/components/ui/field";
import { attemptLogin } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";




export async function LoginForm() {
    return (
        <form className="flex flex-col gap-4">
            <Field>
                <FieldLabel>Enter your email:</FieldLabel>
                <Input
                    name="email"
                    type="email"
                    placeholder=""
                    size={35}
                />
            </Field>

            <Field>
                <FieldLabel htmlFor="password"> Enter your password:</FieldLabel>
                <Input
                    name="password"
                    type="password"
                    placeholder=""
                />
            </Field>

            <Button
                type="submit"
            >
                Submit
            </Button>
        </form>
    )
}