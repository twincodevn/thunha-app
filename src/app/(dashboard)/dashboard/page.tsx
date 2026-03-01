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
import { WelcomeHero } from "@/components/dashboard/welcome-hero";
import { ActionCenter } from "@/components/dashboard/action-center";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { getSmartInsights } from "@/lib/analytics/insights";
import { SmartInsights } from "@/components/dashboard/smart-insights";
import { ExpiringContracts } from "@/components/dashboard/expiring-contracts";
import { PlanGate } from "@/components/subscription/plan-gate";
import { UserPlan } from "@/lib/plans";
import { ViralShareCard } from "@/components/dashboard/viral-share-card";

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
        insights,
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
        getSmartInsights(userId),
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
    recentTenants.forEach((tenant: any) => {
        activities.push({
            id: `tenant-${tenant.id}`,
            type: "TENANT",
            title: `Khách thuê mới`,
            description: `${tenant.name} vừa được thêm vào hệ thống`,
            timestamp: tenant.createdAt,
        });
    });

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
        insights,
    };
}

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) return null;

    const data = await getDashboardData(session.user.id);
    const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { plan: true },
    });
    const userPlan = (currentUser?.plan ?? "FREE") as UserPlan;

    return (
        <DashboardShell className="space-y-8">
            <WelcomeHero />

            <PlanGate requiredPlan="PRO" currentPlan={userPlan} featureName="AI Smart Insights">
                <SmartInsights insights={data.insights} />
            </PlanGate>

            <div className="grid gap-8 md:grid-cols-7 lg:grid-cols-7">
                {/* Main Content (Left) */}
                <div className="space-y-8 md:col-span-4 lg:col-span-5">
                    {/* Key Metrics */}
                    <DashboardStats
                        month={data.month}
                        collected={data.collected}
                        pendingAmount={data.pendingAmount}
                        pendingBills={data.pendingBills}
                        totalRooms={data.totalRooms}
                        occupiedRooms={data.occupiedRooms}
                    />

                    {/* Charts */}
                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
                        <div className="lg:col-span-4">
                            <RevenueForecastCard />
                        </div>
                        <div className="lg:col-span-3">
                            <OccupancyRateCard
                                occupiedRooms={data.occupiedRooms}
                                totalRooms={data.totalRooms}
                            />
                        </div>
                    </div>

                    {/* Expiry Tracking Widget */}
                    <ExpiringContracts contracts={data.expiringContracts} />
                </div>

                {/* Sidebar (Right) */}
                <div className="space-y-6 md:col-span-3 lg:col-span-2">
                    <ViralShareCard />

                    <ActionCenter
                        overdueBills={data.overdueBills}
                        expiringContracts={data.expiringContracts.length}
                        activeIncidents={data.activeIncidents.length}
                    />

                    <RecentActivity activities={data.recentActivities} />
                </div>
            </div>

            {/* Onboarding Wizard (Only show if no properties) */}
            {data.properties === 0 && (
                <div className="mt-8">
                    <OnboardingWizard
                        hasProperties={data.properties > 0}
                        hasRooms={data.totalRooms > 0}
                        hasTenants={data.tenants > 0}
                        hasBills={data.hasBills}
                    />
                </div>
            )}
        </DashboardShell>
    );
}
