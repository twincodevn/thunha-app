"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { roomSchema } from "@/lib/validators";

export async function updateRoomAction(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const roomId = formData.get("id") as string;
    const propertyId = formData.get("propertyId") as string;

    const rawData = {
        roomNumber: formData.get("roomNumber"),
        floor: Number(formData.get("floor")),
        area: formData.get("area") ? Number(formData.get("area")) : undefined,
        baseRent: Number(formData.get("baseRent")),
        deposit: formData.get("deposit") ? Number(formData.get("deposit")) : undefined,
        notes: formData.get("notes"),
        images: formData.getAll("images") as string[],
    };

    // Clean up empty image strings
    if (rawData.images) {
        rawData.images = rawData.images.filter(img => img.trim() !== "");
    }

    try {
        const validated = roomSchema.parse(rawData);

        await prisma.room.update({
            where: { id: roomId, property: { userId: session.user.id } },
            data: {
                ...validated,
                images: rawData.images, // Pass the array of image URLs
            },
        });

        revalidatePath(`/dashboard/properties/${propertyId}/rooms/${roomId}`);
        // redirect is called outside try-catch in server actions ideally, but here we return success to client
        return { success: true };
    } catch (error) {
        console.error("Update Room Error:", error);
        return { error: "Lỗi cập nhật phòng. Vui lòng kiểm tra lại thông tin." };
    }
}
