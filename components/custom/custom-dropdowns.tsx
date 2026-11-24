import { BRANCH_TYPES, BranchTypes, CONTACT_TYPES, ORG_TYPES, REGION_TYPES } from "@/app/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select";
import { programParsing } from "@/lib/utils";

interface CustomSelectProps {
    name: string
    type: readonly string[]
    label?: string
    defVal?: string
}

export function CustomSelect({name, type, label, defVal} : CustomSelectProps) {
    return (
        <Select name={name} defaultValue={defVal?? "Select an Option"}>
            <SelectTrigger>
                <SelectValue placeholder="Select an Option">
                    {(value: string) => programParsing(value)}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>{label ?? "Select"}</SelectLabel>
                    {type.map((t: string) => {
                        return (
                            <SelectItem key={t} value={t}>
                                {programParsing(t)}
                            </SelectItem>
                        )
                    })}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
