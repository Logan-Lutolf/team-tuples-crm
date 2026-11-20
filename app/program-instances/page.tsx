"use server"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboardContainer } from "../dashboard/containers/admin-dashboard-container";
import { SoonTabContainer } from "./containers/soon-tab-container";
import { Button } from "@/components/ui/button";
import { AddSoonForm } from "./forms/add-soon-form";
import { TheatreTabContainer } from "./containers/theatre-tab-container";
import { SeminarTabContainer } from "./containers/seminar-tab-container";



export default async function ProgramInstancesPage() {
    
    
    return (
        <div className="m-8">
            <Tabs>
                <div className="flex flex-row justify-between">
                    <TabsList>
                        <TabsTrigger value="seminars">Seminars</TabsTrigger>
                        <TabsTrigger value="soon">Stories of Our Neighbors</TabsTrigger>
                        <TabsTrigger value="theatre">Theatre Production</TabsTrigger>
                        <TabsTrigger value="storyOn">storyOn</TabsTrigger>
                        <TabsTrigger value="program5">Program #5</TabsTrigger>
                    </TabsList>

                    
                </div>
                
                
                <TabsContent value="seminars"><SeminarTabContainer/></TabsContent>
                <TabsContent value="soon"><SoonTabContainer/></TabsContent>
                <TabsContent value="theatre"><TheatreTabContainer/></TabsContent>
                <TabsContent value="storyOn"></TabsContent>
                <TabsContent value="program5"></TabsContent>
            </Tabs>
        </div>
    )
}