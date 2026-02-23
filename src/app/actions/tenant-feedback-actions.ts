"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitTenantFeedback(data: {
    tenantId: string;
    propertyId: string;
    rating: number;
    comment?: string;
}) {
    // Basic server-side guard
    if (!data.tenantId || !data.propertyId || !data.rating) {
        return { error: "Missing required fields" };
    }

    try {
        await prisma.tenantFeedback.create({
            data: {
                tenantId: data.tenantId,
                propertyId: data.propertyId,
                rating: data.rating,
                comment: data.comment || "",
            },
        });

        const property = await prisma.property.findUnique({
            where: { id: data.propertyId },
            select: { userId: true, name: true }
        });

        if (property) {
            await prisma.notification.create({
                data: {
                    userId: property.userId,
                    title: "Đánh giá mới từ khách thuê",
                    message: `Có 1 đánh giá ${data.rating} sao mới tại khu trọ ${property.name}`,
                    type: "SYSTEM",
                    link: `/dashboard/properties/${data.propertyId}`
                }
            });
        }

        revalidatePath("/portal/feedback");
        // Also revalidate landlord dashboard to show new score if we wanted to
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/properties/" + data.propertyId);

        return { success: true };
    } catch (error) {
        console.error("Feedback error:", error);
        return { error: "Không thể gửi đánh giá lúc này." };
    }
}
