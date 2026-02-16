"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updatePropertyAction(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const electricityRate = parseFloat(formData.get("electricityRate") as string) || 0;
    const waterRate = parseFloat(formData.get("waterRate") as string) || 0;
    const lat = formData.get("lat") ? parseFloat(formData.get("lat") as string) : null;
    const lng = formData.get("lng") ? parseFloat(formData.get("lng") as string) : null;
    const notes = formData.get("notes") as string;

    try {
        await prisma.property.update({
            where: { id, userId: session.user.id },
            data: { name, address, city, electricityRate, waterRate, lat, lng, notes },
        });

        revalidatePath(`/dashboard/properties/${id}`);
    } catch (error) {
        console.error("Error updating property:", error);
        return { error: "Failed to update property" };
    }

    redirect(`/dashboard/properties/${id}`);
}
