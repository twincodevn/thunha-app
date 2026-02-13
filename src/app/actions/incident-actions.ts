"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function createIncident(formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    const propertyId = formData.get("propertyId") as string;
    const roomTenantId = formData.get("roomTenantId") as string; // Optional

    // File handling
    const images: string[] = [];
    const files = formData.getAll("images") as File[];

    if (!title || !description || !propertyId) {
        return { error: "Vui lòng điền đầy đủ thông tin" };
    }

    try {
        // Upload images
        if (files.length > 0) {
            const uploadDir = join(process.cwd(), "public/uploads/incidents");
            await mkdir(uploadDir, { recursive: true });

            for (const file of files) {
                if (file.size > 0) {
                    const buffer = Buffer.from(await file.arrayBuffer());
                    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                    const filepath = join(uploadDir, filename);
                    await writeFile(filepath, buffer);
                    images.push(`/uploads/incidents/${filename}`);
                }
            }
        }

        await prisma.incident.create({
            data: {
                title,
                description,
                priority: priority || "MEDIUM",
                propertyId,
                roomTenantId: roomTenantId || null,
                images: JSON.stringify(images) as any, // Cast to avoid type mismatch with generated client
                status: "OPEN",
            },
        });

        revalidatePath("/dashboard/incidents");
        if (roomTenantId) {
            // Find tenant ID to revalidate tenant page
            const rt = await prisma.roomTenant.findUnique({
                where: { id: roomTenantId },
                select: { tenantId: true }
            });
            if (rt) revalidatePath(`/dashboard/tenants/${rt.tenantId}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Create incident error:", error);
        return { error: "Không thể tạo báo cáo sự cố" };
    }
}

export async function updateIncidentStatus(incidentId: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED", cost?: number) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    try {
        const incident = await prisma.incident.findUnique({
            where: { id: incidentId },
            include: { property: true }
        });

        if (!incident || incident.property.userId !== session.user.id) {
            return { error: "Không tìm thấy sự cố hoặc không có quyền" };
        }

        await prisma.incident.update({
            where: { id: incidentId },
            data: {
                status,
                ...(cost !== undefined && { cost })
            },
        });

        revalidatePath("/dashboard/incidents");
        revalidatePath(`/dashboard/properties/${incident.propertyId}`);
        return { success: true };
    } catch (error) {
        console.error("Update incident error:", error);
        return { error: "Không thể cập nhật trạng thái sự cố" };
    }
}

export async function deleteIncident(incidentId: string) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    try {
        const incident = await prisma.incident.findUnique({
            where: { id: incidentId },
            include: { property: true }
        });

        if (!incident || incident.property.userId !== session.user.id) {
            return { error: "Không tìm thấy sự cố hoặc không có quyền" };
        }

        await prisma.incident.delete({
            where: { id: incidentId },
        });

        revalidatePath("/dashboard/incidents");
        return { success: true };
    } catch (error) {
        console.error("Delete incident error:", error);
        return { error: "Không thể xóa sự cố" };
    }
}
