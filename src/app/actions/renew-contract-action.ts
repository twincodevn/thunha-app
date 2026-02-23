"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createContract } from "@/app/(dashboard)/dashboard/contracts/generate-action";
import { revalidatePath } from "next/cache";

export async function renewContractAction(data: {
    roomTenantId: string;
    roomId: string;
    newEndDate: string;
    newBaseRent: number;
    templateId: string;
}) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        // 1. Verify owner and roomTenant exists
        const roomTenant = await prisma.roomTenant.findUnique({
            where: { id: data.roomTenantId },
            include: { room: { include: { property: true } }, tenant: true }
        });

        if (!roomTenant || roomTenant.room.property.userId !== session.user.id) {
            return { error: "Không tìm thấy hợp đồng hoặc bạn không có quyền." };
        }

        // 2. Perform updates in a transaction (Update Room Rent, Update RoomTenant Dates)
        await prisma.$transaction([
            prisma.room.update({
                where: { id: data.roomId },
                data: { baseRent: data.newBaseRent }
            }),
            prisma.roomTenant.update({
                where: { id: data.roomTenantId },
                data: { endDate: new Date(data.newEndDate) }
            })
        ]);

        // 3. Generate the new Contract using the template
        const newStartDate = roomTenant.endDate ? new Date(roomTenant.endDate) : new Date(); // New contract starts when old one ends, or today

        await createContract(
            data.roomTenantId,
            data.templateId,
            newStartDate, // Start date of renewal
            new Date(data.newEndDate) // New End date
        );

        revalidatePath(`/dashboard/tenants/${roomTenant.tenantId}`);
        revalidatePath(`/dashboard`);

        return { success: true };

    } catch (error) {
        console.error("Renewal Error:", error);
        return { error: "Lỗi hệ thống khi gia hạn hợp đồng." };
    }
}
