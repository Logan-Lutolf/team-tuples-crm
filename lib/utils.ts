import { toast } from "@/components/ui/toast";
import { AddressOutput } from "@/prisma/contract";

export { cn } from "cn"

export function showToast(title: string, description: string, type: "success" | "error" | "warning" = "success") {
    const toaster = toast.add({
        title: title,
        description: description,
        type: type,
    });
}

export function nameInitials(name: string) {
    const splitName = name.split(" ")
    
    var initials: string = ""
    for (let i = 0; i < splitName.length; i++) {
        initials += splitName[i].substring(0,1).toUpperCase()
    }

    return initials
}

export function formatPhoneNumber(phone: string) {
    if (phone.length != 10) return phone
    else {
        return "(" + phone.substring(0,3) + ")" + " " + phone.substring(3,6) + "-" + phone.substring(6)
    }
}

export function formatAddress(address: AddressOutput) {
    return address.street + ", " + address.city + ", " + address.zipCode + ", " + address.country
}


export function relationshipToColor(rel: string) {
    let color = ""
    switch (rel) {
        case "POOR":
            color = "red"
        case "AVERAGE":
            color = "yellow"
        case "EXCELLENT":
            color = "green"
        default:
            color = "yellow"
    }

    return color
}