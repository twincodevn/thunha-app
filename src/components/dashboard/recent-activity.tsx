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
        <Card className="col-span-3 h-full flex flex-col">
            <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
                <CardDescription>Các sự kiện mới nhất trong hệ thống</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-0">
                        {activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <FileText className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm">Chưa có hoạt động nào</p>
                            </div>
                        ) : (
                            activities.map((activity, index) => (
                                <div key={activity.id} className="relative pl-6 pb-6 last:pb-0">
                                    {/* Vertical Line */}
                                    {index !== activities.length - 1 && (
                                        <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />
                                    )}

                                    {/* Icon */}
                                    <div className={`absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center border-2 border-background ${getColor(activity.type)}`}>
                                        {getIcon(activity.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-medium leading-none">{activity.title}</p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: vi })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{activity.description}</p>
                                        {activity.status && (
                                            <div className="mt-1">
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                                                    {activity.status}
                                                </Badge>
                                            </div>
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
