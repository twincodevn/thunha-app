
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getDashboardStats(propertyId?: string, month?: number, year?: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    // Base where clause for room filtering
    const roomWhere: any = {
        property: {
            userId: userId
        }
    };
    if (propertyId) {
        roomWhere.propertyId = propertyId;
    }

    // 1. Revenue (Total Paid Bills in selected month)
    const revenueResult = await prisma.bill.aggregate({
        where: {
            roomTenant: {
                room: roomWhere
            },
            month: currentMonth,
            year: currentYear,
            status: "PAID"
        },
        _sum: {
            total: true
        }
    });
    const revenue = revenueResult._sum.total || 0;

    // 2. Outstanding (Pending + Overdue Bills in selected month)
    const outstandingResult = await prisma.bill.aggregate({
        where: {
            roomTenant: {
                room: roomWhere
            },
            month: currentMonth,
            year: currentYear,
            status: { in: ["PENDING", "OVERDUE"] }
        },
        _sum: {
            total: true
        }
    });
    const outstanding = outstandingResult._sum.total || 0;

    // 3. Occupancy
    const totalRooms = await prisma.room.count({
        where: roomWhere
    });

    const occupiedRooms = await prisma.room.count({
        where: {
            ...roomWhere,
            status: "OCCUPIED"
        }
    });

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // 4. Active Tenants
    const activeTenants = await prisma.roomTenant.count({
        where: {
            room: roomWhere,
            isActive: true
        }
    });

    return {
        revenue,
        outstanding,
        occupancyRate,
        totalRooms,
        occupiedRooms,
        activeTenants
    };
}

export async function getRevenueChartData(propertyId?: string, year?: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const currentYear = year || new Date().getFullYear();

    const roomWhere: any = {
        property: {
            userId: userId
        }
    };
    if (propertyId) {
        roomWhere.propertyId = propertyId;
    }

    // Fetch all paid bills for the year
    const bills = await prisma.bill.findMany({
        where: {
            roomTenant: {
                room: roomWhere
            },
            year: currentYear,
            status: "PAID"
        },
        select: {
            month: true,
            total: true
        }
    });

    // Aggregate by month
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        name: `T${i + 1}`,
        month: i + 1,
        total: 0
    }));

    bills.forEach(bill => {
        const monthIndex = bill.month - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            monthlyData[monthIndex].total += bill.total;
        }
    });

    return monthlyData;
}

export async function getOccupancyStats(propertyId?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const roomWhere: any = {
        property: {
            userId: userId
        }
    };
    if (propertyId) {
        roomWhere.propertyId = propertyId;
    }

    const stats = await prisma.room.groupBy({
        by: ['status'],
        where: roomWhere,
        _count: {
            id: true
        }
    });

    // Transform to friendly format
    const statusMap: Record<string, string> = {
        AVAILABLE: "Trống",
        OCCUPIED: "Đang thuê",
        MAINTENANCE: "Bảo trì"
    };

    const colors: Record<string, string> = {
        AVAILABLE: "#22c55e", // green
        OCCUPIED: "#3b82f6", // blue
        MAINTENANCE: "#f97316" // orange
    };

    return stats.map(item => ({
        name: statusMap[item.status] || item.status,
        value: item._count.id,
        color: colors[item.status] || "#94a3b8"
    }));
}
