import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only allow BUSINESS plan users or admins
        // For now, we check if user has BUSINESS plan
        const _user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        // if (!user || user.plan !== "BUSINESS") {
        //     return NextResponse.json(
        //         { error: "Chức năng này chỉ dành cho gói Business" },
        //         { status: 403 }
        //     );
        // }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "month"; // month, quarter, year

        const now = new Date();
        let startDate: Date;

        switch (period) {
            case "quarter":
                startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            case "year":
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Revenue over time
        const payments = await prisma.payment.findMany({
            where: {
                paidAt: { gte: startDate },
                bill: { roomTenant: { room: { property: { userId: session.user.id } } } },
            },
            select: {
                amount: true,
                paidAt: true,
                method: true,
            },
            orderBy: { paidAt: "asc" },
        });

        // Aggregate by day
        const revenueByDay: Record<string, number> = {};
        const revenueByMethod: Record<string, number> = {};

        payments.forEach((p) => {
            const day = p.paidAt.toISOString().split("T")[0];
            revenueByDay[day] = (revenueByDay[day] || 0) + p.amount;
            revenueByMethod[p.method] = (revenueByMethod[p.method] || 0) + p.amount;
        });

        // Bills by status
        const billStats = await prisma.bill.groupBy({
            by: ["status"],
            where: {
                createdAt: { gte: startDate },
                roomTenant: { room: { property: { userId: session.user.id } } },
            },
            _count: { id: true },
            _sum: { total: true },
        });

        // Room occupancy rate
        const rooms = await prisma.room.findMany({
            where: { property: { userId: session.user.id } },
            select: { status: true },
        });

        const occupancyRate =
            rooms.length > 0
                ? Math.round((rooms.filter((r) => r.status === "OCCUPIED").length / rooms.length) * 100)
                : 0;

        // Tenant count trend
        const tenantCount = await prisma.tenant.count({
            where: { userId: session.user.id },
        });

        const activeTenants = await prisma.roomTenant.count({
            where: {
                isActive: true,
                room: { property: { userId: session.user.id } },
            },
        });

        // Collection rate
        const totalBilled = billStats.reduce((sum, b) => sum + (b._sum.total || 0), 0);
        const paidBills = billStats.find((b) => b.status === "PAID");
        const totalPaid = paidBills?._sum.total || 0;
        const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 100;

        return NextResponse.json({
            period,
            revenue: {
                total: payments.reduce((sum, p) => sum + p.amount, 0),
                byDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })),
                byMethod: revenueByMethod,
            },
            bills: {
                stats: billStats.map((b) => ({
                    status: b.status,
                    count: b._count.id,
                    total: b._sum.total || 0,
                })),
                collectionRate,
            },
            rooms: {
                total: rooms.length,
                occupied: rooms.filter((r) => r.status === "OCCUPIED").length,
                vacant: rooms.filter((r) => r.status === "VACANT").length,
                maintenance: rooms.filter((r) => r.status === "MAINTENANCE").length,
                occupancyRate,
            },
            tenants: {
                total: tenantCount,
                active: activeTenants,
            },
        });
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
