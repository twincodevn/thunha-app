"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function updateContract(formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    const roomTenantId = formData.get("roomTenantId") as string;
    const endDateStr = formData.get("endDate") as string;
    const contractFile = formData.get("contractFile") as File;

    if (!roomTenantId) {
        return { error: "Missing roomTenantId" };
    }

    try {
        // Verify ownership first
        const rt = await prisma.roomTenant.findUnique({
            where: { id: roomTenantId },
            include: { room: { include: { property: true } } },
        });

        if (!rt || rt.room.property.userId !== session.user.id) {
            return { error: "Unauthorized access to this contract" };
        }

        // Prepare update data
        const data: any = {};
        if (endDateStr) {
            data.endDate = new Date(endDateStr);
        } else {
            // If empty, set to null (indefinite)
            data.endDate = null;
        }

        // Handle File Upload
        if (contractFile && contractFile.size > 0) {
            try {
                const buffer = Buffer.from(await contractFile.arrayBuffer());
                const filename = `${Date.now()}-${contractFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                const uploadDir = join(process.cwd(), "public/uploads/contracts");

                await mkdir(uploadDir, { recursive: true });

                const filepath = join(uploadDir, filename);
                await writeFile(filepath, buffer);

                data.contractUrl = `/uploads/contracts/${filename}`;
            } catch (error) {
                console.error("Upload error:", error);
                return { error: "Failed to upload contract file" };
            }
        }

        await prisma.roomTenant.update({
            where: { id: roomTenantId },
            data,
        });

        revalidatePath(`/dashboard/tenants/${rt.tenantId}`);
        revalidatePath("/dashboard"); // Also update dashboard warnings
        return { success: true };
    } catch (error) {
        console.error("Update error:", error);
        return { error: "Failed to update contract" };
    }
}
