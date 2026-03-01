"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
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
            case "INVOICE": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800";
            case "INCIDENT": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800";
            case "TENANT": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800";
            case "PAYMENT": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800";
        }
    };

    const getLink = (id: string, type: ActivityItem["type"]) => {
        const rawId = id.split("-")[1]; // Because id is like "bill-...", "incident-..."
        switch (type) {
            case "INVOICE": return `/dashboard/billing/${rawId}`;
            case "INCIDENT": return `/dashboard/incidents`; // Or /dashboard/incidents/${rawId} if detail page exists
            case "TENANT": return `/dashboard/tenants/${rawId}`;
            case "PAYMENT": return `/dashboard/billing`; // Go to billing for payments
            default: return "#";
        }
    };

    return (
        <Card className="col-span-3 h-full flex flex-col shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg">Hoạt động gần đây</CardTitle>
                    <CardDescription>Cập nhật diễn biến mới nhất từ các khu trọ của bạn</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    <Link href="/dashboard/reports">
                        Xem tất cả <span className="ml-1">→</span>
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pt-4">
                <ScrollArea className="h-[350px] pr-4">
                    <div className="space-y-0 relative">
                        {activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center h-[300px] bg-slate-50/50 dark:bg-zinc-800/20 rounded-2xl ring-1 ring-slate-100 dark:ring-zinc-800/50 mb-4 animate-in fade-in duration-500">
                                <div className="h-16 w-16 bg-white dark:bg-zinc-800 shadow-sm rounded-2xl flex items-center justify-center mb-4 ring-1 ring-slate-100 dark:ring-zinc-700 rotate-3 transition-transform hover:rotate-6">
                                    <FileText className="h-8 w-8 text-slate-400 dark:text-zinc-500" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Chưa có hoạt động nào</h3>
                                <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-[200px]">Các sự kiện mới trong hệ thống sẽ xuất hiện tại đây.</p>
                            </div>
                        ) : (
                            activities.map((activity, index) => {
                                // Check if activity is very new (e.g. within last 1 hour)
                                const isNew = (new Date().getTime() - activity.timestamp.getTime()) < 60 * 60 * 1000;

                                return (
                                    <Link
                                        key={activity.id}
                                        href={getLink(activity.id, activity.type)}
                                        className="relative pl-8 pb-6 block group"
                                    >
                                        {/* Vertical Line */}
                                        {index !== activities.length - 1 && (
                                            <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200 dark:bg-zinc-800 group-hover:bg-blue-300 dark:group-hover:bg-blue-700 transition-colors" />
                                        )}

                                        {/* Icon Container with Pulse effect if new */}
                                        <div className="absolute left-0 top-1">
                                            {isNew && (
                                                <span className="absolute -inset-1 rounded-full bg-blue-400/30 animate-ping"></span>
                                            )}
                                            <div className={`relative h-8 w-8 rounded-full flex items-center justify-center border-2 border-background shadow-sm z-10 ${getColor(activity.type)} transition-transform group-hover:scale-110`}>
                                                {getIcon(activity.type)}
                                            </div>
                                        </div>

                                        {/* Content Card with Glassmorphism Hover */}
                                        <div className="flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-200 border border-transparent group-hover:bg-slate-50 dark:group-hover:bg-zinc-800/50 group-hover:border-slate-100 dark:group-hover:border-zinc-800 group-hover:shadow-sm">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{activity.title}</p>
                                                <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap flex items-center gap-1.5">
                                                    {isNew && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>}
                                                    {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: vi })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{activity.description}</p>

                                            {activity.status && (
                                                <div className="mt-1">
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-[10px] px-2 py-0.5 h-5 font-medium
                                                        ${activity.status === "Mới" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200" : ""}
                                                        ${activity.status === "Đang xử lý" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200" : ""}
                                                    `}
                                                    >
                                                        {activity.status === "Đang xử lý" ? "Đang giải quyết" : activity.status === "Mới" ? "Cần xử lý ngay" : activity.status}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
