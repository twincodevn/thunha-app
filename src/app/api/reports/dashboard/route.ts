import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthYear } from "@/lib/billing";

// GET dashboard statistics
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const { month, year } = getCurrentMonthYear();

        // Get all stats in parallel
        const [
            propertiesCount,
            roomsData,
            tenantsCount,
            billsData,
            monthlyIncome,
        ] = await Promise.all([
            // Properties count
            prisma.property.count({ where: { userId } }),

            // Rooms with status
            prisma.room.groupBy({
                by: ["status"],
                where: { property: { userId } },
                _count: { id: true },
            }),

            // Active tenants
            prisma.roomTenant.count({
                where: { isActive: true, room: { property: { userId } } },
            }),

            // Bills by status
            prisma.bill.groupBy({
                by: ["status"],
                where: { roomTenant: { room: { property: { userId } } } },
                _count: { id: true },
                _sum: { total: true },
            }),

            // This month's income
            prisma.payment.aggregate({
                where: {
                    bill: {
                        month,
                        year,
                        roomTenant: { room: { property: { userId } } },
                    },
                },
                _sum: { amount: true },
            }),
        ]);

        // Calculate expected monthly income
        const occupiedRooms = await prisma.room.findMany({
            where: { property: { userId }, status: "OCCUPIED" },
            select: { baseRent: true },
        });
        const expectedIncome = occupiedRooms.reduce((sum, r) => sum + r.baseRent, 0);

        // Format rooms data
        const rooms = {
            total: roomsData.reduce((sum, r) => sum + r._count.id, 0),
            occupied: roomsData.find((r) => r.status === "OCCUPIED")?._count.id || 0,
            vacant: roomsData.find((r) => r.status === "VACANT")?._count.id || 0,
            maintenance: roomsData.find((r) => r.status === "MAINTENANCE")?._count.id || 0,
        };

        // Format bills data
        const bills = {
            pending: billsData.find((b) => b.status === "PENDING")?._count.id || 0,
            pendingAmount: billsData.find((b) => b.status === "PENDING")?._sum.total || 0,
            overdue: billsData.find((b) => b.status === "OVERDUE")?._count.id || 0,
            overdueAmount: billsData.find((b) => b.status === "OVERDUE")?._sum.total || 0,
            paid: billsData.find((b) => b.status === "PAID")?._count.id || 0,
            paidAmount: billsData.find((b) => b.status === "PAID")?._sum.total || 0,
        };

        return NextResponse.json({
            properties: propertiesCount,
            rooms,
            tenants: tenantsCount,
            bills,
            expectedIncome,
            monthlyIncome: monthlyIncome._sum.amount || 0,
            currentMonth: { month, year },
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
