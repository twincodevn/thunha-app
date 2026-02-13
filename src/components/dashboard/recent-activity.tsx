"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Wrench, UserPlus, CreditCard } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface ActivityItem {
    id: string;
    type: "INVOICE" | "INCIDENT" | "TENANT" | "PAYMENT";
    title: string;
    description: string;
    timestamp: Date;
    status?: string;
}

interface RecentActivityProps {
    activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
    const getIcon = (type: ActivityItem["type"]) => {
        switch (type) {
            case "INVOICE": return <FileText className="h-4 w-4" />;
            case "INCIDENT": return <Wrench className="h-4 w-4" />;
            case "TENANT": return <UserPlus className="h-4 w-4" />;
            case "PAYMENT": return <CreditCard className="h-4 w-4" />;
        }
    };

    const getColor = (type: ActivityItem["type"]) => {
        switch (type) {
            case "INVOICE": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "INCIDENT": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
            case "TENANT": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "PAYMENT": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
        }
    };

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
                <CardDescription>Các sự kiện mới nhất trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-6">
                        {activities.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground py-4">Chưa có hoạt động nào</p>
                        ) : (
                            activities.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-4">
                                    <div className={`mt-0.5 rounded-full p-2 ${getColor(activity.type)}`}>
                                        {getIcon(activity.type)}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <p className="text-sm font-medium leading-none">{activity.title}</p>
                                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-muted-foreground block">
                                            {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: vi })}
                                        </span>
                                        {activity.status && (
                                            <Badge variant="outline" className="mt-1 text-[10px] px-1 py-0 h-4">
                                                {activity.status}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
