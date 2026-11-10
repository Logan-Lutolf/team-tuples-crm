import { toast } from "@/components/ui/toast";

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