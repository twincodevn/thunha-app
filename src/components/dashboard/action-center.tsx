"use client";

import Link from "next/link";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock,
    FileText,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/billing";

interface ActionItem {
    id: string;
    type: "BILL_OVERDUE" | "CONTRACT_EXPIRING" | "INCIDENT_OPEN" | "CONTRACT_EXPIRED";
    title: string;
    subtitle: string;
    href: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
}

interface ActionCenterProps {
    overdueBills: any[];
    expiringContracts: number;
    activeIncidents: number;
}

export function ActionCenter({ overdueBills, expiringContracts, activeIncidents }: ActionCenterProps) {
    // Transform data into actionable items
    const actions: ActionItem[] = [];

    // Add overdue bills (limit to top 3)
    overdueBills.slice(0, 3).forEach(bill => {
        actions.push({
            id: bill.id,
            type: "BILL_OVERDUE",
            title: `Hóa đơn quá hạn - ${bill.roomTenant.room.roomNumber}`,
            subtitle: `${bill.roomTenant.tenant.name} • ${formatCurrency(bill.total)}`,
            href: `/dashboard/billing/${bill.id}`,
            priority: "HIGH"
        });
    });

    if (expiringContracts > 0) {
        actions.push({
            id: "expiring-contracts",
            type: "CONTRACT_EXPIRING",
            title: `${expiringContracts} Hợp đồng sắp hết hạn`,
            subtitle: "Xem danh sách và gia hạn",
            href: "/dashboard/tenants?filter=expiring",
            priority: "MEDIUM"
        });
    }

    if (activeIncidents > 0) {
        actions.push({
            id: "incidents",
            type: "INCIDENT_OPEN",
            title: `${activeIncidents} Sự cố đang chờ xử lý`,
            subtitle: "Cần phản hồi hoặc sửa chữa",
            href: "/dashboard/incidents",
            priority: "HIGH"
        });
    }

    if (actions.length === 0) {
        return (
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-900/50">
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center p-6 min-h-[200px]">
                    <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-green-800 dark:text-green-400">Mọi thứ đều ổn!</h3>
                    <p className="text-sm text-green-600/80 dark:text-green-500/80 mt-1">
                        Không có việc cần xử lý gấp. Bạn có thể thư giãn.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-l-4 border-l-orange-500 shadow-md">
            <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        Trung tâm hành động
                    </CardTitle>
                    <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded-full dark:bg-orange-900/30 dark:text-orange-400">
                        {actions.length} việc cần làm
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {actions.map((action) => (
                        <div key={action.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 rounded-full p-1.5 ${action.type === "BILL_OVERDUE" ? "bg-red-100 text-red-600" :
                                        action.type === "INCIDENT_OPEN" ? "bg-orange-100 text-orange-600" :
                                            "bg-blue-100 text-blue-600"
                                    }`}>
                                    {action.type === "BILL_OVERDUE" && <AlertCircle className="h-4 w-4" />}
                                    {action.type === "INCIDENT_OPEN" && <AlertCircle className="h-4 w-4" />}
                                    {action.type.includes("CONTRACT") && <Clock className="h-4 w-4" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium leading-none">{action.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{action.subtitle}</p>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                <Link href={action.href}>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="p-2 border-t bg-muted/10 text-center">
                    <Button variant="link" size="sm" className="text-xs text-muted-foreground" asChild>
                        <Link href="/dashboard/notifications">Xem tất cả thông báo</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
