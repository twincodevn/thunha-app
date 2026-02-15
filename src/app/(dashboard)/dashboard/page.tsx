import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Building2, Users, Receipt, AlertTriangle, Plus, ArrowRight,
    Zap, Droplets, CreditCard, TrendingUp, Clock, CheckCircle2,
    AlertCircle, DollarSign
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, getCurrentMonthYear, formatDate } from "@/lib/billing";
import { ROOM_STATUS_LABELS, BILL_STATUS_LABELS } from "@/lib/constants";

import { FinancialOverview } from "@/components/dashboard/financial-overview";
import { OccupancyRateCard } from "@/components/dashboard/occupancy-card";
import { RevenueForecastCard } from "@/components/dashboard/revenue-forecast-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { AIInsights } from "@/components/dashboard/ai-insights";

interface ActivityItem {
    id: string;
    type: "INVOICE" | "INCIDENT" | "TENANT" | "PAYMENT";
    title: string;
    description: string;
    timestamp: Date;
    status?: string;
}

async function getDashboardData(userId: string) {
    const { month, year } = getCurrentMonthYear();

    const [
        properties,
        rooms,
        tenants,
        pendingBills,
        overdueBills,
        recentBills,
        recentPayments,
        totalCollected,
        totalPending,
        expiringContracts,
        activeIncidents,
        recentTenants,
    ] = await Promise.all([
        prisma.property.count({ where: { userId } }),
        prisma.room.findMany({
            where: { property: { userId } },
            include: { property: true },
        }),
        prisma.tenant.count({ where: { userId } }),
        prisma.bill.count({
            where: {
                roomTenant: { room: { property: { userId } } },
                status: "PENDING",
            },
        }),
        // Overdue bills with details
        prisma.bill.findMany({
            where: {
                roomTenant: { room: { property: { userId } } },
                status: "OVERDUE",
            },
            include: {
                roomTenant: {
                    include: {
                        room: { include: { property: true } },
                        tenant: true,
                    },
                },
            },
            orderBy: { dueDate: "asc" },
            take: 5,
        }),
        // Recent bills
        prisma.bill.findMany({
            where: { roomTenant: { room: { property: { userId } } } },
            include: {
                roomTenant: {
                    include: {
                        room: { include: { property: true } },
                        tenant: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
        // Recent payments
        prisma.payment.findMany({
            where: {
                bill: { roomTenant: { room: { property: { userId } } } },
            },
            include: {
                bill: {
                    include: {
                        roomTenant: {
                            include: {
                                room: { include: { property: true } },
                                tenant: true,
                            },
                        },
                    },
                },
            },
            orderBy: { paidAt: "desc" },
            take: 5,
        }),
        // Total collected this month
        prisma.payment.aggregate({
            where: {
                bill: {
                    roomTenant: { room: { property: { userId } } },
                    month,
                    year,
                },
            },
            _sum: { amount: true },
        }),
        // Total pending this month
        prisma.bill.aggregate({
            where: {
                roomTenant: { room: { property: { userId } } },
                status: { in: ["PENDING", "OVERDUE"] },
            },
            _sum: { total: true },
        }),
        // Expiring contracts (next 30 days)
        prisma.roomTenant.findMany({
            where: {
                room: { property: { userId } },
                isActive: true,
                endDate: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            },
            include: {
                room: { include: { property: true } },
                tenant: true,
            },
            orderBy: { endDate: "asc" },
            take: 5,
        }),
        // Active incidents
        prisma.incident.findMany({
            where: {
                property: { userId },
                status: { in: ["OPEN", "IN_PROGRESS"] },
            },
            include: {
                property: { select: { name: true } },
                roomTenant: {
                    include: {
                        room: { select: { roomNumber: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
        // Recent Tenants
        prisma.tenant.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 3,
        }),
    ]);

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r: any) => r.status === "OCCUPIED").length;
    const vacantRooms = rooms.filter((r: any) => r.status === "VACANT").length;
    const maintenanceRooms = rooms.filter((r: any) => r.status === "MAINTENANCE").length;

    // Construct Activity Feed
    const activities: ActivityItem[] = [];

    // Add recent bills
    recentBills.forEach((bill: any) => {
        activities.push({
            id: `bill-${bill.id}`,
            type: "INVOICE",
            title: `Hóa đơn mới #${bill.id.slice(-4)}`,
            description: `${bill.roomTenant.room.property.name} - P.${bill.roomTenant.room.roomNumber} (${formatCurrency(bill.total)})`,
            timestamp: bill.createdAt,
            status: BILL_STATUS_LABELS[bill.status as keyof typeof BILL_STATUS_LABELS],
        });
    });

    // Add recent payments
    recentPayments.forEach((payment: any) => {
        activities.push({
            id: `payment-${payment.id}`,
            type: "PAYMENT",
            title: `Thanh toán nhận được`,
            description: `${payment.bill.roomTenant.tenant.name} đã thanh toán ${formatCurrency(payment.amount)}`,
            timestamp: payment.paidAt,
        });
    });

    // Add active incidents (recently created)
    activeIncidents.forEach((incident: any) => {
        activities.push({
            id: `incident-${incident.id}`,
            type: "INCIDENT",
            title: `Sự cố: ${incident.title}`,
            description: `${incident.property.name} ${incident.roomTenant ? `- P.${incident.roomTenant.room.roomNumber}` : ""}`,
            timestamp: incident.createdAt,
            status: incident.status === "OPEN" ? "Mới" : "Đang xử lý",
        });
    });

    // Add new tenants
    // Actually, I need to update the destructuring at the top. Let's start with proper destructuring.

    // Sort activities by timestamp desc
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Count total bills for onboarding
    const totalBillCount = await prisma.bill.count({
        where: { roomTenant: { room: { property: { userId } } } }
    });

    return {
        properties,
        totalRooms,
        occupiedRooms,
        vacantRooms,
        maintenanceRooms,
        activeIncidents,
        overdueBills,
        expiringContracts,
        recentActivities: activities.slice(0, 10),
        tenants,
        pendingBills,
        expectedIncome: rooms
            .filter((r: any) => r.status === "OCCUPIED")
            .reduce((sum: number, r: any) => sum + r.baseRent, 0),
        collected: totalCollected._sum.amount || 0,
        pendingAmount: totalPending._sum.total || 0,
        recentBills,
        recentPayments,
        rooms,
        month,
        year,
        hasBills: totalBillCount > 0,
    };
}

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) return null;

    const data = await getDashboardData(session.user.id);

    return (
        <DashboardShell>
            <PageHeader
                title={`Xin chào, ${session.user.name || "Bạn"}! 👋`}
                description={`Tổng quan hoạt động cho thuê · Tháng ${data.month}/${data.year}`}
            >
                <div className="flex gap-2">
                    <Button variant="outline" className="hidden sm:flex" asChild>
                        <Link href="/dashboard/properties/new">
                            <Building2 className="mr-2 h-4 w-4" />
                            Thêm tòa nhà
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/billing/generate">
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo hóa đơn
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            {/* Onboarding Wizard */}
            <OnboardingWizard
                hasProperties={data.properties > 0}
                hasRooms={data.totalRooms > 0}
                hasTenants={data.tenants > 0}
                hasBills={data.hasBills}
            />

            {/* Overdue Alert Banner */}
            {data.overdueBills.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
                    <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                            <div>
                                <h3 className="font-semibold text-destructive">
                                    {data.overdueBills.length} hóa đơn quá hạn cần xử lý
                                </h3>
                                <p className="text-sm text-muted-foreground hidden sm:block">
                                    Tổng tiền: <span className="font-medium text-foreground">{formatCurrency(data.overdueBills.reduce((sum, b) => sum + b.total, 0))}</span>
                                </p>
                            </div>
                        </div>
                        <Button variant="destructive" size="sm" asChild>
                            <Link href="/dashboard/billing?status=OVERDUE">
                                Xử lý ngay <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Dashboard Main Content */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Left Column (4/7) */}
                <div className="col-span-4 space-y-6">
                    {/* Key Metrics Grid */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <OccupancyRateCard totalRooms={data.totalRooms} occupiedRooms={data.occupiedRooms} />

                        <div className="grid gap-4">
                            <Card className="border-0 shadow-sm overflow-hidden relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40">
                                <div className="absolute top-0 right-0 p-3 opacity-5">
                                    <TrendingUp className="h-24 w-24" />
                                </div>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                        Doanh thu dự kiến
                                    </CardTitle>
                                    <DollarSign className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-100">
                                        {formatCurrency(data.expectedIncome)}
                                    </div>
                                    <p className="text-xs text-blue-600/80 dark:text-blue-300/80 mt-1 font-medium">
                                        Tiền thuê căn bản tháng này
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm overflow-hidden relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40">
                                <div className="absolute top-0 right-0 p-3 opacity-5">
                                    <CheckCircle2 className="h-24 w-24" />
                                </div>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                        Thực thu tháng {data.month}
                                    </CardTitle>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">
                                        {formatCurrency(data.collected)}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="h-1.5 w-full bg-emerald-200/50 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-500"
                                                style={{ width: `${Math.min(100, (data.collected / (data.expectedIncome || 1)) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 min-w-[30px]">
                                            {((data.collected / (data.expectedIncome || 1)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Financial Overview Chart */}
                    <FinancialOverview />
                </div>

                {/* Right Column (3/7) */}
                <div className="col-span-3 space-y-6">
                    {/* AI Insights */}
                    <AIInsights
                        occupiedRooms={data.occupiedRooms}
                        totalRooms={data.totalRooms}
                        collected={data.collected}
                        expectedIncome={data.expectedIncome}
                        pendingBills={data.pendingBills}
                        overdueBills={data.overdueBills.length}
                    />

                    {/* Recent Activity Feed */}
                    <RecentActivity activities={data.recentActivities} />

                    {/* Quick Stats - Expiring Contracts */}
                    {data.expiringContracts.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-orange-500" />
                                    Hợp đồng sắp hết hạn
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-2">
                                {data.expiringContracts.slice(0, 3).map((rt) => (
                                    <div key={rt.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
                                        <div className="grid gap-0.5">
                                            <span className="font-medium">{rt.tenant.name}</span>
                                            <span className="text-xs text-muted-foreground">{rt.room.property.name} - P.{rt.room.roomNumber}</span>
                                        </div>
                                        <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900 dark:text-orange-400">
                                            {formatDate(rt.endDate!)}
                                        </Badge>
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" className="w-full mt-1 text-xs" asChild>
                                    <Link href="/dashboard/tenants">Xem tất cả</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </DashboardShell>
    );
}
