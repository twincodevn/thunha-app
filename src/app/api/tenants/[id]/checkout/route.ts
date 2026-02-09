import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST checkout tenant from room
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
        const { roomTenantId } = body;

        // Verify tenant ownership
        const tenant = await prisma.tenant.findFirst({
            where: { id: tenantId, userId: session.user.id },
        });

        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        // Find active room tenant
        const roomTenant = await prisma.roomTenant.findFirst({
            where: roomTenantId
                ? { id: roomTenantId, tenantId, isActive: true }
                : { tenantId, isActive: true },
            include: { room: true },
        });

        if (!roomTenant) {
            return NextResponse.json(
                { error: "Khách thuê không có phòng đang thuê" },
                { status: 400 }
            );
        }

        // Check for unpaid bills
        const unpaidBills = await prisma.bill.count({
            where: {
                roomTenantId: roomTenant.id,
                status: { in: ["PENDING", "OVERDUE"] },
            },
        });

        if (unpaidBills > 0) {
            return NextResponse.json(
                { error: `Còn ${unpaidBills} hóa đơn chưa thanh toán` },
                { status: 400 }
            );
        }

        // Update room tenant to inactive
        await prisma.roomTenant.update({
            where: { id: roomTenant.id },
            data: {
                isActive: false,
                endDate: new Date(),
            },
        });

        // Update room status to VACANT
        await prisma.room.update({
            where: { id: roomTenant.roomId },
            data: { status: "VACANT" },
        });

        return NextResponse.json({ message: "Checkout successful" });
    } catch (error) {
        console.error("Error checking out tenant:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
