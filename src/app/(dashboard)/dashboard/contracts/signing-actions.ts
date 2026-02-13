
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveSignature(contractId: string, role: "LANDLORD" | "TENANT", signature: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { roomTenant: { include: { room: { include: { property: true } } } } },
    });

    if (!contract) return { error: "Contract not found" };

    // Verify permissions: Only landlord or the assigned tenant can sign
    const userId = session.user.id;
    const isLandlord = contract.roomTenant.room.property.userId === userId;
    const isTenant = contract.roomTenant.tenantId === userId;

    // For now, allow landlord to capture tenant signature (In-person scenario)
    if (!isLandlord && !isTenant) {
        return { error: "Permission denied" };
    }

    // If saving tenant signature as landlord (In-person), it's allowed.
    // So if user is landlord, they can sign as landlord OR capture tenant.

    const updateData: any = {};
    if (role === "LANDLORD") {
        if (!isLandlord) return { error: "Only landlord can sign as landlord" };
        updateData.landlordSignature = signature;
    } else if (role === "TENANT") {
        // Allow landlord to capture tenant signature too
        if (!isLandlord && !isTenant) return { error: "Permission denied" };
        updateData.tenantSignature = signature;
    }

    try {
        await prisma.contract.update({
            where: { id: contractId },
            data: updateData,
        });

        // Check completion status
        const updated = await prisma.contract.findUnique({ where: { id: contractId } });
        if (updated?.landlordSignature && updated?.tenantSignature) {
            await prisma.contract.update({
                where: { id: contractId },
                data: { status: "SIGNED", signedAt: new Date() },
            });
        }

        revalidatePath(`/dashboard/contracts/${contractId}`);
        return { success: true };
    } catch (error) {
        console.error("Save signature error:", error);
        return { error: "Failed to save signature" };
    }
}
