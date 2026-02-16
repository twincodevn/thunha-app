"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createContract(roomTenantId: string, templateId: string, startDate: Date, endDate?: Date) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Fetch necessary data
    const template = await prisma.contractTemplate.findUnique({
        where: { id: templateId },
    });
    const roomTenant = await prisma.roomTenant.findUnique({
        where: { id: roomTenantId },
        include: {
            tenant: true,
            room: { include: { property: { include: { user: true } } } },
        },
    });

    if (!template || !roomTenant) throw new Error("Data not found");

    // Replace placeholders
    let content = template.content;
    const replacements: Record<string, string> = {
        "{{TENANT_NAME}}": roomTenant.tenant.name,
        "{{TENANT_ID}}": roomTenant.tenant.idNumber || "....................",
        "{{TENANT_ADDRESS}}": roomTenant.tenant.address || "....................",
        "{{ROOM_NUMBER}}": roomTenant.room.roomNumber,
        "{{RENT_PRICE}}": roomTenant.room.baseRent.toLocaleString('vi-VN') + " đ",
        "{{DEPOSIT}}": (roomTenant.room.deposit || 0).toLocaleString('vi-VN') + " đ",
        "{{ELEC_PRICE}}": roomTenant.room.property.electricityRate.toLocaleString('vi-VN') + " đ",
        "{{WATER_PRICE}}": roomTenant.room.property.waterRate.toLocaleString('vi-VN') + " đ",
        "{{START_DATE}}": startDate.toLocaleDateString('vi-VN'),
        "{{END_DATE}}": endDate ? endDate.toLocaleDateString('vi-VN') : "Không thời hạn",
        "{{PROPERTY_ADDRESS}}": roomTenant.room.property.address,
        "{{LANDLORD_NAME}}": roomTenant.room.property.user.name,
        "{{LANDLORD_PHONE}}": roomTenant.room.property.user.phone || "",
    };

    for (const [key, value] of Object.entries(replacements)) {
        content = content.replace(new RegExp(key, "g"), value);
    }

    try {
        await prisma.contract.create({
            data: {
                roomTenantId,
                templateId,
                content,
                startDate,
                endDate,
                status: "DRAFT", // Created as draft initially
            },
        });
        revalidatePath(`/dashboard/tenants/${roomTenant.tenantId}`);
        return { success: true };
    } catch (error) {
        console.error("Error creating contract:", error);
        return { error: "Failed to create contract" };
    }
}
