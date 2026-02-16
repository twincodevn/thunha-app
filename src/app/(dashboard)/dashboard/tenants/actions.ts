"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function searchTenants(query: string) {
    const session = await auth();
    if (!session?.user) return [];

    if (!query || query.length < 2) return [];

    const tenants = await prisma.tenant.findMany({
        where: {
            userId: session.user.id,
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
            ],
        },
        select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            roomTenants: {
                where: { isActive: true },
                select: {
                    room: { select: { roomNumber: true, property: { select: { name: true } } } }
                }
            }
        },
        take: 5,
    });

    return tenants.map(t => ({
        ...t,
        currentRoom: t.roomTenants[0]?.room
            ? `${t.roomTenants[0].room.property.name} - P.${t.roomTenants[0].room.roomNumber}`
            : null
    }));
}

export async function assignTenantToRoom(tenantId: string, roomId: string, startDate: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    // Check if room is vacant? Or just allow adding another tenant? 
    // Usually we allow multiple tenants per room.

    // Check if tenant belongs to user
    const tenant = await prisma.tenant.findFirst({
        where: { id: tenantId, userId: session.user.id },
    });

    if (!tenant) throw new Error("Tenant not found");

    await prisma.roomTenant.create({
        data: {
            roomId,
            tenantId,
            startDate: new Date(startDate),
            isActive: true,
        },
    });

    // Update room status to OCCUPIED if it was VACANT or COMING_SOON
    await prisma.room.update({
        where: { id: roomId },
        data: { status: "OCCUPIED" },
    });

    return { success: true };
}
