"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Receipt, Clock, AlertTriangle, ExternalLink } from "lucide-react";
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

export function NotificationCenter() {
    const [data, setData] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);

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
        // Refresh every 60 seconds
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const totalCount = data?.counts?.total || 0;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {totalCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-in zoom-in-50">
                            {totalCount > 99 ? "99+" : totalCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0" align="end" sideOffset={8}>
                <div className="px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Thông báo</h3>
                        {totalCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] h-5">
                                {totalCount} mới
                            </Badge>
                        )}
                    </div>
                </div>

                <ScrollArea className="max-h-[400px]">
                    {!data || totalCount === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                            <div className="p-3 rounded-full bg-muted mb-3">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">Không có thông báo mới</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {/* New Notifications */}
                            {data.notifications && data.notifications.length > 0 && (
                                <div className="p-2">
                                    <h4 className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 px-2 py-1 flex items-center gap-1.5">
                                        <Bell className="h-3 w-3" />
                                        Mới nhất ({data.notifications.length})
                                    </h4>
                                    {data.notifications.map((notif: any) => (
                                        <Link
                                            key={notif.id}
                                            href={notif.link || "/dashboard"}
                                            onClick={async () => {
                                                setIsOpen(false);
                                                // Mark as read API
                                                await fetch("/api/notifications", {
                                                    method: "PATCH",
                                                    body: JSON.stringify({ id: notif.id }),
                                                });
                                            }}
                                            className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/60 transition-colors group relative"
                                        >
                                            <div className="mt-0.5 p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                                <Bell className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-sm font-medium truncate">{notif.title}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                                    Vừa xong
                                                </p>
                                            </div>
                                            <span className="absolute top-3 right-2 h-2 w-2 rounded-full bg-blue-500"></span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {/* Overdue Bills */}
                            {data.overdueBills.length > 0 && (
                                <div className="p-2">
                                    <h4 className="text-[11px] font-semibold text-red-600 dark:text-red-400 px-2 py-1 flex items-center gap-1.5">
                                        <Receipt className="h-3 w-3" />
                                        Hóa đơn quá hạn ({data.overdueBills.length})
                                    </h4>
                                    {data.overdueBills.slice(0, 5).map((bill: any) => (
                                        <Link
                                            key={bill.id}
                                            href={`/dashboard/billing/${bill.id}`}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/60 transition-colors group"
                                        >
                                            <div className="mt-0.5 p-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shrink-0">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium truncate">{bill.tenantName}</p>
                                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 shrink-0 ml-2">
                                                        {formatCurrency(bill.total)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {bill.propertyName} - P.{bill.roomNumber}
                                                </p>
                                                <p className="text-[11px] text-red-500 font-medium mt-0.5">
                                                    Quá hạn {bill.daysOverdue} ngày
                                                </p>
                                            </div>
                                            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Expiring Contracts */}
                            {data.expiringContracts.length > 0 && (
                                <div className="p-2">
                                    <h4 className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 px-2 py-1 flex items-center gap-1.5">
                                        <Clock className="h-3 w-3" />
                                        Hợp đồng sắp hết hạn ({data.expiringContracts.length})
                                    </h4>
                                    {data.expiringContracts.slice(0, 5).map((contract: any) => (
                                        <Link
                                            key={contract.id}
                                            href="/dashboard/tenants"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/60 transition-colors group"
                                        >
                                            <div className="mt-0.5 p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shrink-0">
                                                <Clock className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{contract.tenantName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {contract.propertyName} - P.{contract.roomNumber}
                                                </p>
                                                <p className="text-[11px] text-orange-500 font-medium mt-0.5">
                                                    Còn {contract.daysLeft} ngày
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Active Incidents */}
                            {data.recentIncidents.length > 0 && (
                                <div className="p-2">
                                    <h4 className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 px-2 py-1 flex items-center gap-1.5">
                                        <AlertTriangle className="h-3 w-3" />
                                        Sự cố đang xử lý ({data.recentIncidents.length})
                                    </h4>
                                    {data.recentIncidents.slice(0, 3).map((incident: any) => (
                                        <Link
                                            key={incident.id}
                                            href="/dashboard/incidents"
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/60 transition-colors group"
                                        >
                                            <div className="mt-0.5 p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{incident.title}</p>
                                                <p className="text-xs text-muted-foreground">{incident.propertyName}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                {totalCount > 0 && (
                    <>
                        <Separator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs h-8"
                                asChild
                            >
                                <Link href="/dashboard/billing?status=OVERDUE" onClick={() => setIsOpen(false)}>
                                    Xem tất cả hóa đơn quá hạn
                                </Link>
                            </Button>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}
