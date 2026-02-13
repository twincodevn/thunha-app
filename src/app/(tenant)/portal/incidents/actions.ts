
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { incidentSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function createIncident(formData: z.infer<typeof incidentSchema>) {
    const session = await auth();

    if (!session || session.user.role !== "TENANT") {
        return { error: "Unauthorized" };
    }

    const validatedFields = incidentSchema.safeParse(formData);

    if (!validatedFields.success) {
        return { error: "Dữ liệu không hợp lệ" };
    }

    const { title, description, images } = validatedFields.data;

    // Find the active RoomTenant for this tenant
    const roomTenant = await prisma.roomTenant.findFirst({
        where: {
            tenantId: session.user.id,
            isActive: true,
        },
        include: {
            room: true,
        }
    });

    if (!roomTenant) {
        return { error: "Không tìm thấy thông tin phòng thuê" };
    }

    try {
        await prisma.incident.create({
            data: {
                propertyId: roomTenant.room.propertyId,
                roomTenantId: roomTenant.id,
                title,
                description,
                images: images ? JSON.stringify(images) : "[]",
                status: "OPEN",
                priority: "MEDIUM",
            },
        });
    } catch (error) {
        console.error("Failed to create incident:", error);
        return { error: "Có lỗi xảy ra khi tạo báo cáo" };
    }

    revalidatePath("/portal/incidents");
    revalidatePath("/portal/dashboard");
    redirect("/portal/incidents");
}
