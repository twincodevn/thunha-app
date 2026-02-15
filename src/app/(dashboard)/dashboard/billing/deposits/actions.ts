"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDeposits() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;

    const roomTenants = await prisma.roomTenant.findMany({
        where: {
            room: { property: { userId } },
            isActive: true,
        },
        include: {
            tenant: { select: { name: true, phone: true } },
            room: {
                select: {
                    roomNumber: true,
                    deposit: true,
                    property: { select: { name: true } },
                },
            },
            deposits: { orderBy: { date: "desc" } },
        },
        orderBy: { createdAt: "desc" },
    });

    return roomTenants.map((rt) => {
        const received = rt.deposits
            .filter((d) => d.type === "RECEIVED")
            .reduce((sum, d) => sum + d.amount, 0);
        const returned = rt.deposits
            .filter((d) => d.type === "RETURNED")
            .reduce((sum, d) => sum + d.amount, 0);
        const deducted = rt.deposits
            .filter((d) => d.type === "DEDUCTED")
            .reduce((sum, d) => sum + d.amount, 0);

        return {
            id: rt.id,
            tenantName: rt.tenant.name,
            tenantPhone: rt.tenant.phone,
            roomNumber: rt.room.roomNumber,
            propertyName: rt.room.property.name,
            contractDeposit: rt.room.deposit || 0,
            received,
            returned,
            deducted,
            balance: received - returned - deducted,
            transactions: rt.deposits.map((d) => ({
                id: d.id,
                type: d.type,
                amount: d.amount,
                reason: d.reason,
                date: d.date.toISOString(),
            })),
        };
    });
}

export async function recordDeposit(data: {
    roomTenantId: string;
    amount: number;
    type: "RECEIVED" | "RETURNED" | "DEDUCTED";
    reason?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    if (data.amount <= 0) return { error: "Số tiền phải lớn hơn 0" };

    // Verify ownership
    const roomTenant = await prisma.roomTenant.findUnique({
        where: { id: data.roomTenantId },
        include: { room: { include: { property: true } } },
    });

    if (!roomTenant || roomTenant.room.property.userId !== session.user.id) {
        return { error: "Unauthorized" };
    }

    await prisma.deposit.create({
        data: {
            roomTenantId: data.roomTenantId,
            amount: data.amount,
            type: data.type,
            reason: data.reason,
        },
    });

    revalidatePath("/dashboard/billing/deposits");
    return { success: true };
}
