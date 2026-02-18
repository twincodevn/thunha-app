"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Receipt, Clock, AlertTriangle, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { formatCurrency } from "@/lib/billing";
import { getNotifications } from "@/app/actions/notification-actions";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function NotificationCenter() {
    const [data, setData] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

    const fetchData = useCallback(async () => {
        try {
            const result = await getNotifications();
            setData(result);
        } catch (e) {
            console.error("Failed to load notifications", e);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setData((prev: any) => {
            const isCurrentlyUnread = !prev.notifications.find((n: any) => n.id === id)?.isRead;
            if (!isCurrentlyUnread) return prev;

            return {
                ...prev,
                notifications: prev.notifications.map((n: any) =>
                    n.id === id ? { ...n, isRead: true } : n
                ),
                counts: {
                    ...prev.counts,
                    notifications: Math.max(0, prev.counts.notifications - 1),
                    total: Math.max(0, prev.counts.total - 1)
                }
            };
        });

        await fetch("/api/notifications", {
            method: "PATCH",
            body: JSON.stringify({ id }),
        });
        fetchData();
    };

    const handleMarkAllRead = async () => {
        setData((prev: any) => ({
            ...prev,
            notifications: prev.notifications.map((n: any) => ({ ...n, isRead: true })),
            counts: { ...prev.counts, notifications: 0, total: prev.counts.total - prev.counts.notifications }
        }));

        await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({}) });
        fetchData();
    };

    const totalCount = data?.counts?.total || 0;
    const unreadCount = data?.counts?.notifications || 0;

    const displayedNotifications = data?.notifications?.filter((n: any) => {
        if (activeTab === "unread") return !n.isRead;
        return true;
    }) || [];

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    {totalCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[420px] p-0 shadow-xl border-slate-100 dark:border-slate-800" align="end" sideOffset={8}>
                <div className="flex flex-col h-[500px]">
                    <div className="px-4 py-3 border-b flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">Thông báo</h3>
                            {unreadCount > 0 && (
                                <Badge variant="secondary" className="px-1.5 h-5 min-w-5 flex items-center justify-center bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                    {unreadCount}
                                </Badge>
                            )}
                        </div>
                        <div className="flex bg-muted/50 p-0.5 rounded-lg">
                            <button
                                onClick={() => setActiveTab("all")}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === "all" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => setActiveTab("unread")}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === "unread" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                Chưa đọc
                            </button>
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <div className="px-4 py-2 border-b bg-white dark:bg-slate-950 flex justify-end">
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[11px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                            >
                                <CheckCircle2 className="h-3 w-3" />
                                Đánh dấu tất cả là đã đọc
                            </button>
                        </div>
                    )}

                    <ScrollArea className="flex-1">
                        {!data || totalCount === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[300px] text-center px-8">
                                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                                    <Bell className="h-8 w-8 text-slate-300" />
                                </div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">Không có thông báo mới</h4>
                                <p className="text-xs text-slate-500 mt-1">Khi có hoạt động mới, thông báo sẽ hiển thị tại đây.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                <div className="space-y-0">
                                    {/* Overdue Bills */}
                                    {data.overdueBills?.length > 0 && activeTab === 'all' && (
                                        <div className="bg-orange-50/50 dark:bg-orange-950/10">
                                            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-orange-600/80 sticky top-0 bg-inherit backdrop-blur-sm z-10">
                                                Hóa đơn quá hạn
                                            </div>
                                            {data.overdueBills.map((bill: any) => (
                                                <Link key={bill.id} href={`/dashboard/billing/${bill.id}`} onClick={() => setIsOpen(false)} className="flex items-start gap-3 p-4 hover:bg-orange-100/50 transition-colors border-b border-orange-100/50 last:border-0">
                                                    <div className="mt-0.5 p-1.5 rounded-full bg-red-100 text-red-600 shrink-0">
                                                        <Receipt className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-red-700">Thanh toán quá hạn</p>
                                                        <p className="text-xs text-slate-600 mt-0.5">Phòng {bill.roomNumber} - {bill.propertyName}</p>
                                                        <p className="text-xs font-semibold text-red-600 mt-1">{formatCurrency(bill.total)}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Expiring Contracts */}
                                    {data.expiringContracts?.length > 0 && activeTab === 'all' && (
                                        <div className="bg-yellow-50/50 dark:bg-yellow-950/10">
                                            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-yellow-600/80 sticky top-0 bg-inherit backdrop-blur-sm z-10">
                                                Hợp đồng sắp hết hạn
                                            </div>
                                            {data.expiringContracts.map((contract: any) => (
                                                <Link key={contract.id} href={`/dashboard/tenants`} onClick={() => setIsOpen(false)} className="flex items-start gap-3 p-4 hover:bg-yellow-100/50 transition-colors border-b border-yellow-100/50 last:border-0">
                                                    <div className="mt-0.5 p-1.5 rounded-full bg-yellow-100 text-yellow-600 shrink-0">
                                                        <Clock className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-yellow-700">Hợp đồng sắp hết hạn</p>
                                                        <p className="text-xs text-slate-600 mt-0.5">Phòng {contract.roomNumber} - {contract.propertyName}</p>
                                                        <p className="text-xs font-semibold text-yellow-600 mt-1">Còn {contract.daysLeft} ngày</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    {/* Recent Incidents */}
                                    {data.recentIncidents?.length > 0 && activeTab === 'all' && (
                                        <div className="bg-blue-50/50 dark:bg-blue-950/10">
                                            <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-600/80 sticky top-0 bg-inherit backdrop-blur-sm z-10">
                                                Sự cố mới
                                            </div>
                                            {data.recentIncidents.map((incident: any) => (
                                                <Link key={incident.id} href={`/dashboard/incidents`} onClick={() => setIsOpen(false)} className="flex items-start gap-3 p-4 hover:bg-blue-100/50 transition-colors border-b border-blue-100/50 last:border-0">
                                                    <div className="mt-0.5 p-1.5 rounded-full bg-blue-100 text-blue-600 shrink-0">
                                                        <AlertTriangle className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-blue-700">{incident.title}</p>
                                                        <p className="text-xs text-slate-600 mt-0.5">{incident.propertyName}</p>
                                                        <p className="text-xs font-semibold text-blue-600 mt-1">Đang xử lý</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {displayedNotifications.map((notif: any) => (
                                    <Link
                                        key={notif.id}
                                        href={notif.link || "/dashboard"}
                                        onClick={() => {
                                            if (!notif.isRead) handleMarkAsRead(notif.id);
                                            setIsOpen(false);
                                        }}
                                        className={`flex items-start gap-4 p-4 transition-colors relative group ${notif.isRead ? 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900' : 'bg-blue-50/30 dark:bg-blue-900/10 hover:bg-blue-50/60'}`}
                                    >
                                        <div className={`mt-0.5 p-2 rounded-full shrink-0 ${notif.isRead ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                                            {notif.type === 'INCIDENT' ? <AlertTriangle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className={`text-sm ${notif.isRead ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                                                    {notif.title}
                                                </p>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })}
                                                </span>
                                            </div>
                                            <p className={`text-xs mt-0.5 line-clamp-2 ${notif.isRead ? 'text-slate-500' : 'text-slate-600'}`}>
                                                {notif.message}
                                            </p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500 shadow-sm"></div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <div className="p-2 border-t bg-slate-50 dark:bg-slate-900">
                        <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                            <Link href="/dashboard/notifications" onClick={() => setIsOpen(false)}>
                                Xem tất cả thông báo
                            </Link>
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
