import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";

interface ActionDialogProps {
    icon: React.ReactNode
    content: React.ReactNode,
    variant?: "link" | "default" | "outline" | "secondary" | "ghost" | "destructive" | null | undefined
}

export function ActionDialog({icon, content, variant} : ActionDialogProps) {
    return(
        <Dialog>
            <DialogTrigger render={<Button variant={variant}>{icon}</Button>}/>
            <DialogContent>
                {content}
            </DialogContent>
        </Dialog>
    )
}