import { DashboardCard } from "@/components/custom/dashboard-card";



export function AdminDashboard() {
    return (
        <div className="flex flex-row gap-4 h-full m-12">
            <div className="w-2/3 flex flex-col gap-4">
                <div className="flex flex-row gap-4 h-1/3">
                    <div className="w-2/3">
                        <DashboardCard 
                            title="Updates"
                            desc=""
                        />
                    </div>
                    <div className="w-1/3">
                        <DashboardCard 
                            title="Currently Active"
                            desc=""
                            number={30}
                        />
                    </div>
                </div>
                <div className="h-2/3">
                    <DashboardCard 
                        title="Recent Activity"
                        desc=""
                    />
                </div>
            </div>

            <div className="w-1/3">
                <DashboardCard 
                    title="To-Do"
                    desc=""
                />
            </div>
        </div>
    )
}