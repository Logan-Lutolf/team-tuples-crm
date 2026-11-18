import { BRANCH_TYPES, BranchTypes, CONTACT_TYPES, ORG_TYPES, REGION_TYPES } from "@/app/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import { programParsing } from "@/lib/utils";


// So i def could make a much more dynamic component that swaps out the types to map, but I already wrote these soooooo...

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

export function SelectPersonRole() {
    return (
        <Select name="role">
            <SelectTrigger>
                Select a Role
                <SelectValue/>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    {CONTACT_TYPES.map((t) => {
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

export function SelectOrgType() {
    return (
        <Select name="type">
            <SelectTrigger>
                <SelectValue/>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>Regions</SelectLabel>
                    {ORG_TYPES.map((t) => {
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
