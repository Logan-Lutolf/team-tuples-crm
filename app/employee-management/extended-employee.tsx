import { Separator } from "@/components/ui/separator";
import { Avatar } from "@/components/ui/avatar";

import { SmallContactTableContainer } from "./small-contact-table-container";


interface ExtendedEmployeeProps {
    id: number
    name: string
    role: string
    region?: string
    email: string
    phone?: string

}


export function ExtendedEmployee(props: ExtendedEmployeeProps) {
    return (
        <div className="flex flex-row gap-3">
            <div className="flex flex-col gap-4">
                <div className="flex flex-row gap-2 items-center">
                    <Avatar/>
                    {props.name}
                </div>
                <div className="flex flex-col gap-2">
                    <span>{props.role}</span>
                    <span>{props.region}</span>
                    <br/>
                    <span>{props.email}</span>
                    <span>{props.phone}</span>
                </div>
            </div>

            <Separator orientation="vertical"/>

            <div className="flex flex-col gap-4">
                <SmallContactTableContainer employeeId={props.id}/>
            </div>
        </div>
    )
}