"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendPushToTenant } from "@/app/api/push/send/route";

export async function createAnnouncement(data: { propertyId: string, title: string, content: string }) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        // Verify ownership
        const property = await prisma.property.findUnique({
            where: { id: data.propertyId, userId: session.user.id }
        });

        if (!property) return { error: "Không tìm thấy tòa nhà hoặc bạn không có quyền." };

        const announcement = await prisma.announcement.create({
            data: {
                propertyId: data.propertyId,
                userId: session.user.id,
                title: data.title,
                content: data.content
            }
        });

        // Broadcast notification to all active tenants in this property
        const activeRooms = await prisma.room.findMany({
            where: { propertyId: data.propertyId },
            include: {
                roomTenants: {
                    where: { isActive: true }
                }
            }
        });

        const notifications = [];
        for (const room of activeRooms) {
            for (const rt of room.roomTenants) {
                notifications.push({
                    tenantId: rt.tenantId,
                    title: `Thông báo mới: ${data.title}`,
                    message: data.content.substring(0, 100) + (data.content.length > 100 ? "..." : ""),
                    type: "ANNOUNCEMENT"
                });
            }
        }

        if (notifications.length > 0) {
            await prisma.notification.createMany({
                data: notifications
            });

            // 🔔 Web Push: thông báo đến từng cư dân (best-effort)
            for (const notif of notifications) {
                sendPushToTenant({
                    tenantId: notif.tenantId,
                    title: notif.title,
                    message: notif.message,
                }).catch((e) => console.warn("[Push] Announcement notify failed:", e));
            }
        }

        revalidatePath(`/dashboard/properties/${data.propertyId}/announcements`);
        revalidatePath(`/dashboard/properties/${data.propertyId}`);
        return { success: true, announcement };
    } catch (error) {
        console.error("Error creating announcement:", error);
        return { error: "Lỗi hệ thống khi tạo thông báo." };
    }
}

export async function deleteAnnouncement(announcementId: string, propertyId: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        await prisma.announcement.delete({
            where: {
                id: announcementId,
                userId: session.user.id // ensure ownership
            }
        });

        revalidatePath(`/dashboard/properties/${propertyId}/announcements`);
        revalidatePath(`/dashboard/properties/${propertyId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return { error: "Lỗi hệ thống khi xóa thông báo." };
    }
}
