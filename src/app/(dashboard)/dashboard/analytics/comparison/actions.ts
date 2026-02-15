"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getPropertyComparison(year?: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const properties = await prisma.property.findMany({
        where: { userId },
        include: {
            rooms: {
                select: {
                    id: true,
                    status: true,
                    baseRent: true,
                    roomTenants: {
                        where: { isActive: true },
                        select: { id: true },
                    },
                },
            },
        },
        orderBy: { name: "asc" },
    });

    // Batch fetch bills for all properties
    const allBills = await prisma.bill.findMany({
        where: {
            year: currentYear,
            roomTenant: { room: { property: { userId } } },
        },
        select: {
            total: true,
            status: true,
            month: true,
            roomTenant: { select: { room: { select: { propertyId: true } } } },
        },
    });

    // Batch fetch incidents
    const allIncidents = await prisma.incident.findMany({
        where: {
            property: { userId },
            createdAt: {
                gte: new Date(currentYear, 0, 1),
                lte: new Date(currentYear, 11, 31),
            },
        },
        select: {
            cost: true,
            propertyId: true,
        },
    });

    return properties.map((property) => {
        const propertyBills = allBills.filter(
            (b) => b.roomTenant.room.propertyId === property.id
        );
        const totalRooms = property.rooms.length;
        const occupiedRooms = property.rooms.filter((r) => r.status === "OCCUPIED").length;
        const activeTenants = property.rooms.reduce((sum, r) => sum + r.roomTenants.length, 0);

        const revenue = propertyBills
            .filter((b) => b.status === "PAID")
            .reduce((sum, b) => sum + b.total, 0);

        const outstanding = propertyBills
            .filter((b) => b.status === "PENDING" || b.status === "OVERDUE")
            .reduce((sum, b) => sum + b.total, 0);

        const overdueBills = propertyBills.filter((b) => b.status === "OVERDUE").length;

        const expenses = allIncidents
            .filter((i) => i.propertyId === property.id)
            .reduce((sum, i) => sum + (i.cost || 0), 0);

        // Monthly revenue data
        const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
            const monthBills = propertyBills.filter(
                (b) => b.month === i + 1 && b.status === "PAID"
            );
            return monthBills.reduce((sum, b) => sum + b.total, 0);
        });

        const potentialRent = property.rooms.reduce((sum, r) => sum + r.baseRent, 0);

        return {
            id: property.id,
            name: property.name,
            address: property.address,
            totalRooms,
            occupiedRooms,
            occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
            activeTenants,
            revenue,
            outstanding,
            overdueBills,
            expenses,
            netProfit: revenue - expenses,
            potentialRent,
            monthlyRevenue,
        };
    });
}
