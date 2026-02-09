import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST assign tenant to room
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: tenantId } = await params;
        const body = await request.json();
        const { roomId, startDate, endDate } = body;

        if (!roomId) {
            return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
        }

        // Verify tenant ownership
        const tenant = await prisma.tenant.findFirst({
            where: { id: tenantId, userId: session.user.id },
        });

        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        // Verify room ownership
        const room = await prisma.room.findFirst({
            where: { id: roomId, property: { userId: session.user.id } },
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Check if room already has active tenant
        const activeRoomTenant = await prisma.roomTenant.findFirst({
            where: { roomId, isActive: true },
        });

        if (activeRoomTenant) {
            return NextResponse.json(
                { error: "Phòng đã có khách thuê. Vui lòng trả phòng trước." },
                { status: 400 }
            );
        }

        // Create room tenant assignment
        const roomTenant = await prisma.roomTenant.create({
            data: {
                roomId,
                tenantId,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                isActive: true,
            },
            include: {
                room: { include: { property: true } },
                tenant: true,
            },
        });

        // Update room status to OCCUPIED
        await prisma.room.update({
            where: { id: roomId },
            data: { status: "OCCUPIED" },
        });

        return NextResponse.json(roomTenant, { status: 201 });
    } catch (error) {
        console.error("Error assigning tenant:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
