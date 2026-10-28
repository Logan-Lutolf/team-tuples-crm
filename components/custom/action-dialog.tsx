import { Button } from "../ui/button";
import { BigDialogContent, Dialog, DialogContent, DialogTrigger } from "../ui/dialog";

interface ActionDialogProps {
    icon: React.ReactNode
    content: React.ReactNode,
    variant?: "link" | "default" | "outline" | "secondary" | "ghost" | "destructive" | null | undefined
    className?: string
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

export function BigActionDialog({icon, content, variant, className} : ActionDialogProps) {
    return(
        <Dialog>
            <DialogTrigger render={<Button variant={variant}>{icon}</Button>}/>
            <BigDialogContent className={className}>
                {content}
            </BigDialogContent>
        </Dialog>
    )
}