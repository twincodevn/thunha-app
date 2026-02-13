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
import { RecentActivity } from "@/components/dashboard/recent-activity";

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

    return {
        properties,
        totalRooms,
        occupiedRooms,
        vacantRooms,
        maintenanceRooms,
        activeIncidents,
        overdueBills,
        expiringContracts,
        // ... other data
        recentActivities: activities.slice(0, 10),

        // Keep existing returns for backward compatibility if needed, but we typically consume this object directly
        tenants,
        pendingBills,
        expectedIncome: rooms
            .filter((r: any) => r.status === "OCCUPIED")
            .reduce((sum: number, r: any) => sum + r.baseRent, 0),
        collected: totalCollected._sum.amount || 0,
        pendingAmount: totalPending._sum.total || 0,
        recentBills, // Keeping for now, might replace usage in UI
        recentPayments, // Keeping for now
        rooms,
        month,
        year,
    };
}

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) return null;

    const data = await getDashboardData(session.user.id);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Xin chào, {session.user.name || "Bạn"}! 👋
                    </h1>
                    <p className="text-muted-foreground">
                        Tổng quan hoạt động cho thuê · Tháng {data.month}/{data.year}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/properties/new">
                            <Building2 className="mr-2 h-4 w-4" />
                            Thêm tòa nhà
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/billing/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo hóa đơn
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Overdue Alert Banner */}
            {data.overdueBills.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-destructive">
                                    {data.overdueBills.length} hóa đơn quá hạn cần xử lý
                                </h3>
                                <div className="mt-2 space-y-1">
                                    {data.overdueBills.slice(0, 3).map((bill) => {
                                        const daysOverdue = Math.floor(
                                            (Date.now() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                                        );
                                        return (
                                            <p key={bill.id} className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    {bill.roomTenant.tenant.name}
                                                </span>
                                                {" · "}
                                                {bill.roomTenant.room.property.name} - Phòng {bill.roomTenant.room.roomNumber}
                                                {" · "}
                                                <span className="text-destructive font-medium">
                                                    {formatCurrency(bill.total)} · quá hạn {daysOverdue} ngày
                                                </span>
                                            </p>
                                        );
                                    })}
                                </div>
                                <Button variant="destructive" size="sm" className="mt-3" asChild>
                                    <Link href="/dashboard/billing?status=OVERDUE">
                                        Xem tất cả hóa đơn quá hạn
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Expiring Contracts Alert */}
            {data.expiringContracts && data.expiringContracts.length > 0 && (
                <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-yellow-700 dark:text-yellow-500">
                                    {data.expiringContracts.length} hợp đồng sắp hết hạn (30 ngày tới)
                                </h3>
                                <div className="mt-2 space-y-1">
                                    {data.expiringContracts.slice(0, 3).map((rt) => {
                                        if (!rt.endDate) return null;
                                        const daysLeft = Math.ceil(
                                            (new Date(rt.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                        );
                                        return (
                                            <p key={rt.id} className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground">
                                                    {rt.tenant.name}
                                                </span>
                                                {" · "}
                                                {rt.room.property.name} - Phòng {rt.room.roomNumber}
                                                {" · "}
                                                <span className="text-yellow-600 dark:text-yellow-500 font-medium">
                                                    còn {daysLeft} ngày ({new Date(rt.endDate).toLocaleDateString("vi-VN")})
                                                </span>
                                            </p>
                                        );
                                    })}
                                </div>
                                <Button variant="outline" size="sm" className="mt-3 border-yellow-200 hover:bg-yellow-100 hover:text-yellow-800 dark:border-yellow-800 dark:hover:bg-yellow-900" asChild>
                                    <Link href="/dashboard/tenants">
                                        Xem danh sách khách thuê
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Active Incidents Alert */}
            {data.activeIncidents && data.activeIncidents.length > 0 && (
                <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-900/10">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-orange-700 dark:text-orange-500">
                                    {data.activeIncidents.length} sự cố đang chờ xử lý
                                </h3>
                                <div className="mt-2 space-y-1">
                                    {data.activeIncidents.slice(0, 3).map((incident: any) => (
                                        <p key={incident.id} className="text-sm text-muted-foreground">
                                            <span className="font-medium text-foreground">
                                                {incident.title}
                                            </span>
                                            {" · "}
                                            {incident.property.name}
                                            {incident.roomTenant && ` - Phòng ${incident.roomTenant.room.roomNumber}`}
                                            {" · "}
                                            <span className="text-orange-600 dark:text-orange-500 font-medium lowercase">
                                                {incident.status === "OPEN" ? "Mới" : "Đang xử lý"}
                                            </span>
                                        </p>
                                    ))}
                                </div>
                                <Button variant="outline" size="sm" className="mt-3 border-orange-200 hover:bg-orange-100 hover:text-orange-800 dark:border-orange-800 dark:hover:bg-orange-900" asChild>
                                    <Link href="/dashboard/incidents">
                                        Xem tất cả sự cố
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
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
                            <Card className="border-0 shadow-lg overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <TrendingUp className="h-16 w-16" />
                                </div>
                                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                                    <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                        Doanh thu dự kiến
                                    </CardTitle>
                                    <DollarSign className="h-4 w-4 text-blue-600" />
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="text-3xl font-extrabold tracking-tight text-blue-900 dark:text-blue-100">
                                        {formatCurrency(data.expectedIncome)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 font-medium">
                                        Tiền thuê căn bản tháng này
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <CheckCircle2 className="h-16 w-16" />
                                </div>
                                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                                    <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                        Thực thu tháng {data.month}
                                    </CardTitle>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="text-3xl font-extrabold tracking-tight text-emerald-700 dark:text-emerald-300">
                                        {formatCurrency(data.collected)}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="h-1 w-full bg-emerald-100 dark:bg-emerald-900 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-500"
                                                style={{ width: `${Math.min(100, (data.collected / (data.expectedIncome || 1)) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-600">
                                            {((data.collected / (data.expectedIncome || 1)) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Financial Overview Chart */}
                    <FinancialOverview />

                    {/* Quick Actions Grid (If properties exist) */}
                    {data.properties > 0 && (
                        <div className="grid gap-3 sm:grid-cols-3">
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                                <Link href="/dashboard/billing/new">
                                    <Receipt className="h-6 w-6 text-blue-500" />
                                    <span>Tạo hóa đơn</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                                <Link href="/dashboard/properties">
                                    <Zap className="h-6 w-6 text-yellow-500" />
                                    <span>Ghi điện nước</span>
                                </Link>
                            </Button>
                            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                                <Link href="/dashboard/incidents">
                                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                                    <span>Báo cáo sự cố</span>
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Column (3/7) */}
                <div className="col-span-3 space-y-6">
                    {/* Recent Activity Feed */}
                    <RecentActivity activities={data.recentActivities} />

                    {/* Room Status Summary */}
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">Tình trạng phòng</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/dashboard/properties">
                                    Chi tiết <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <span className="text-sm font-medium">Đang thuê</span>
                                    </div>
                                    <p className="text-2xl font-bold">{data.occupiedRooms}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-muted"></div>
                                        <span className="text-sm font-medium">Còn trống</span>
                                    </div>
                                    <p className="text-2xl font-bold">{data.vacantRooms}</p>
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-3">
                                {data.rooms.slice(0, 5).map((room: any) => (
                                    <div key={room.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${room.status === "OCCUPIED" ? "bg-green-500" :
                                                room.status === "MAINTENANCE" ? "bg-orange-500" : "bg-muted"
                                                }`} />
                                            <span className="text-sm font-medium">
                                                {room.property.name} - P.{room.roomNumber}
                                            </span>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">
                                            {ROOM_STATUS_LABELS[room.status as keyof typeof ROOM_STATUS_LABELS]}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
