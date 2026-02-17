"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getNotifications() {
    const session = await auth();
    if (!session?.user?.id) return { overdueBills: [], expiringContracts: [], recentIncidents: [], counts: { total: 0, overdue: 0, expiring: 0, incidents: 0 } };

    const userId = session.user.id;

    const [overdueBills, expiringContracts, recentIncidents, notifications] = await Promise.all([
        // Overdue bills
        prisma.bill.findMany({
            where: {
                status: "OVERDUE",
                roomTenant: { room: { property: { userId } } },
            },
            include: {
                roomTenant: {
                    include: {
                        room: { include: { property: { select: { name: true } } } },
                        tenant: { select: { name: true } },
                    },
                },
            },
            orderBy: { dueDate: "asc" },
            take: 10,
        }),
        // Expiring contracts (within 30 days)
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
                room: { include: { property: { select: { name: true } } } },
                tenant: { select: { name: true } },
            },
            orderBy: { endDate: "asc" },
            take: 10,
        }),
        // Recent unresolved incidents
        prisma.incident.findMany({
            where: {
                property: { userId },
                status: { in: ["OPEN", "IN_PROGRESS"] },
            },
            include: {
                property: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
        // New Notifications (Events)
        prisma.notification.findMany({
            where: {
                userId,
                isRead: false,
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        }),
    ]);

    return {
        notifications: notifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            link: n.link,
            createdAt: n.createdAt.toISOString(),
            isRead: n.isRead,
        })),
        overdueBills: overdueBills.map((bill) => ({
            id: bill.id,
            tenantName: bill.roomTenant.tenant.name,
            roomNumber: bill.roomTenant.room.roomNumber,
            propertyName: bill.roomTenant.room.property.name,
            total: bill.total,
            dueDate: bill.dueDate.toISOString(),
            daysOverdue: Math.floor((Date.now() - bill.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
        })),
        expiringContracts: expiringContracts.map((rt) => ({
            id: rt.id,
            tenantName: rt.tenant.name,
            roomNumber: rt.room.roomNumber,
            propertyName: rt.room.property.name,
            endDate: rt.endDate!.toISOString(),
            daysLeft: Math.floor((rt.endDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        })),
        recentIncidents: recentIncidents.map((inc) => ({
            id: inc.id,
            title: inc.title,
            propertyName: inc.property.name,
            status: inc.status,
            createdAt: inc.createdAt.toISOString(),
        })),
        counts: {
            total: overdueBills.length + expiringContracts.length + recentIncidents.length + notifications.length,
            overdue: overdueBills.length,
            expiring: expiringContracts.length,
            incidents: recentIncidents.length,
            notifications: notifications.length,
        },
    };
}
