"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function superQuickAdd(data: {
    propertyName: string;
    roomNumber: string;
    tenantName: string;
    baseRent: number;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Property
            const property = await tx.property.create({
                data: {
                    userId: session.user?.id as string,
                    name: data.propertyName || "Nhà trọ của tôi",
                    address: "Chưa cập nhật",
                    electricityRate: 3500,
                    waterRate: 20000,
                },
            });

            // 2. Create Room
            const room = await tx.room.create({
                data: {
                    propertyId: property.id,
                    roomNumber: data.roomNumber || "01",
                    baseRent: data.baseRent,
                    area: 20,
                    status: "OCCUPIED",
                },
            });

            // 3. Create Tenant
            const tenant = await tx.tenant.create({
                data: {
                    userId: session.user?.id as string,
                    name: data.tenantName,
                    phone: "0000000000", // Placeholder if not provided
                },
            });

            // 4. Link Room and Tenant (Contract)
            const roomTenant = await tx.roomTenant.create({
                data: {
                    roomId: room.id,
                    tenantId: tenant.id,
                    startDate: new Date(),
                },
            });

            return { property, room, tenant, roomTenant };
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tenants");
        revalidatePath("/dashboard/properties");

        return { success: true, id: result.tenant.id };
    } catch (error: any) {
        console.error("Super Quick Add Error:", error);
        return { error: error.message || "Lỗi khi tạo dữ liệu nhanh" };
    }
}
