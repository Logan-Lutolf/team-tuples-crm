import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"


interface DashboardCardProps {
    title?: string
    desc?: string
    number?: number
    numberDesc?: string
}

export function DashboardCard(props: DashboardCardProps) {
    return (
        <Card className="h-full shadow-md border-accent border">
            <CardHeader>
                <CardTitle>{props.title}</CardTitle>
                <CardDescription>{props.desc}</CardDescription>
            </CardHeader>
            <CardContent>
                    
            </CardContent>
        </Card>
    )
}