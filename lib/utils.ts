import { toast } from "@/components/ui/toast";

export { cn } from "cn"

export function showToast(title: string, description: string, type: "success" | "error" | "warning" = "success") {
    const toaster = toast.add({
        title: title,
        description: description,
        type: type,
    });
}