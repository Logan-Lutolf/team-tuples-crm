import { BRANCH_TYPES, BranchTypes, REGION_TYPES } from "@/app/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import { programParsing } from "@/lib/utils";




export function SelectBranch() {
    return (
        <Select name="branch">
            <SelectTrigger>
                <SelectValue/>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Branches</SelectLabel>
                    {BRANCH_TYPES.map((b) => {
                        return (
                            <SelectItem key={b} value={b}>
                                {programParsing(b)}
                            </SelectItem>
                        )
                    })}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}


export function SelectRegion() {
    return (
        <Select name="region">
            <SelectTrigger>
                <SelectValue/>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Regions</SelectLabel>
                    {REGION_TYPES.map((r) => {
                        return (
                            <SelectItem key={r} value={r}>
                                {programParsing(r)}
                            </SelectItem>
                        )
                    })}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}