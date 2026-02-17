
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

    const roomTenant = await prisma.roomTenant.findFirst({
        where: {
            tenantId: session.user.id,
            isActive: true,
        },
        include: {
            room: {
                include: {
                    property: true,
                }
            },
        }
    });

    if (!roomTenant) {
        return { error: "Không tìm thấy thông tin phòng thuê" };
    }

    try {
        const incident = await prisma.incident.create({
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

        // Create notification for Landlord
        await prisma.notification.create({
            data: {
                userId: roomTenant.room.property.userId,
                title: `Sự cố mới: Phòng ${roomTenant.room.roomNumber}`,
                message: `${title} - ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`,
                type: "INCIDENT",
                link: `/dashboard/incidents?id=${incident.id}`,
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
