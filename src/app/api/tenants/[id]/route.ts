import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantSchema } from "@/lib/validators";

// GET single tenant
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const tenant = await prisma.tenant.findFirst({
            where: { id, userId: session.user.id },
            include: {
                roomTenants: {
                    include: {
                        room: { include: { property: true } },
                        bills: {
                            orderBy: [{ year: "desc" }, { month: "desc" }],
                            take: 12,
                        },
                    },
                    orderBy: { startDate: "desc" },
                },
            },
        });

        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (error) {
        console.error("Error fetching tenant:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT update tenant
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validated = tenantSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation error", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const existing = await prisma.tenant.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        const tenant = await prisma.tenant.update({
            where: { id },
            data: {
                ...validated.data,
                email: validated.data.email || null,
                dateOfBirth: validated.data.dateOfBirth
                    ? new Date(validated.data.dateOfBirth)
                    : null,
            },
        });

        return NextResponse.json(tenant);
    } catch (error) {
        console.error("Error updating tenant:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE tenant
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const existing = await prisma.tenant.findFirst({
            where: { id, userId: session.user.id },
            include: {
                roomTenants: {
                    where: { isActive: true },
                    include: { room: true }
                }
            }
        });

        if (!existing) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        // Prevent deletion if tenant has active room assignments
        if (existing.roomTenants.length > 0) {
            const roomNumbers = existing.roomTenants.map(rt => rt.room.roomNumber).join(", ");
            return NextResponse.json(
                { error: `Không thể xóa khách thuê đang ở phòng ${roomNumbers}. Vui lòng trả phòng trước.` },
                { status: 400 }
            );
        }

        // Check for unpaid bills from any past room assignment
        const unpaidBills = await prisma.bill.count({
            where: {
                roomTenant: { tenantId: id },
                status: { in: ["PENDING", "OVERDUE"] }
            }
        });

        if (unpaidBills > 0) {
            return NextResponse.json(
                { error: `Không thể xóa khách thuê còn ${unpaidBills} hóa đơn chưa thanh toán.` },
                { status: 400 }
            );
        }

        // Find rooms that might become orphaned (OCCUPIED but no active tenant after delete)
        const allRoomTenants = await prisma.roomTenant.findMany({
            where: { tenantId: id },
            select: { roomId: true }
        });
        const roomIds = [...new Set(allRoomTenants.map(rt => rt.roomId))];

        await prisma.$transaction(async (tx) => {
            // Delete the tenant (cascade deletes roomTenants)
            await tx.tenant.delete({ where: { id } });

            // Reset any orphaned rooms to VACANT
            for (const roomId of roomIds) {
                const hasActiveTenant = await tx.roomTenant.findFirst({
                    where: { roomId, isActive: true }
                });
                if (!hasActiveTenant) {
                    await tx.room.update({
                        where: { id: roomId },
                        data: { status: "VACANT" }
                    });
                }
            }
        });

        return NextResponse.json({ message: "Tenant deleted" });
    } catch (error) {
        console.error("Error deleting tenant:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
