"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export type AssetStatus = "GOOD" | "REPAIR" | "BROKEN" | "LOST";

export async function createAsset(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const roomId = formData.get("roomId") as string;
    const name = formData.get("name") as string;
    const code = formData.get("code") as string;
    const value = parseFloat(formData.get("value") as string) || 0;
    const status = (formData.get("status") as AssetStatus) || "GOOD";
    const notes = formData.get("notes") as string;
    const purchaseDate = formData.get("purchaseDate") ? new Date(formData.get("purchaseDate") as string) : null;

    if (!roomId || !name) return { error: "Vui lòng nhập tên tài sản" };

    try {
        const images: string[] = [];
        const files = formData.getAll("images") as File[];

        if (files.length > 0) {
            try {
                const uploadDir = join(process.cwd(), "public/uploads/assets");
                await mkdir(uploadDir, { recursive: true });

                for (const file of files) {
                    if (file.size > 0) {
                        const buffer = Buffer.from(await file.arrayBuffer());
                        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
                        const filepath = join(uploadDir, filename);
                        await writeFile(filepath, buffer);
                        images.push(`/uploads/assets/${filename}`);
                    }
                }
            } catch (uploadError) {
                console.error("Image upload failed (likely read-only fs):", uploadError);
                // Continue without images
            }
        }

        await (prisma as any).asset.create({
            data: {
                roomId,
                name,
                code,
                value,
                status,
                notes,
                purchaseDate,
                images: JSON.stringify(images),
            },
        });

        revalidatePath(`/dashboard/rooms/${roomId}`);
        return { success: true };
    } catch (error) {
        console.error("Create asset error:", error);
        return { error: "Không thể thêm tài sản" };
    }
}

export async function applyAssetTemplate(roomId: string, templateType: "BASIC" | "FULL") {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const templates = {
        BASIC: [
            { name: "Giường", status: "GOOD" },
            { name: "Nệm", status: "GOOD" },
            { name: "Tủ quần áo", status: "GOOD" },
            { name: "Quạt trần/Quạt điện", status: "GOOD" },
        ],
        FULL: [
            { name: "Máy lạnh", status: "GOOD" },
            { name: "Tủ lạnh", status: "GOOD" },
            { name: "Máy giặt", status: "GOOD" },
            { name: "Giường & Nệm", status: "GOOD" },
            { name: "Tủ quần áo", status: "GOOD" },
            { name: "Bàn làm việc & Ghế", status: "GOOD" },
            { name: "Kệ bếp", status: "GOOD" },
        ],
    };

    const items = templates[templateType];

    try {
        await (prisma as any).asset.createMany({
            data: items.map(item => ({
                ...item,
                roomId,
                images: JSON.stringify([]),
            })),
        });

        revalidatePath(`/dashboard/rooms/${roomId}`);
        return { success: true };
    } catch (error) {
        console.error("Apply template error:", error);
        return { error: "Không thể áp dụng mẫu nội thất" };
    }
}

export async function updateAsset(assetId: string, data: any) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        const asset = await (prisma as any).asset.update({
            where: { id: assetId },
            data,
        });

        revalidatePath(`/dashboard/rooms/${asset.roomId}`);
        return { success: true };
    } catch (error) {
        console.error("Update asset error:", error);
        return { error: "Không thể cập nhật tài sản" };
    }
}

export async function deleteAsset(assetId: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        const asset = await (prisma as any).asset.delete({
            where: { id: assetId },
        });

        revalidatePath(`/dashboard/rooms/${asset.roomId}`);
        return { success: true };
    } catch (error) {
        console.error("Delete asset error:", error);
        return { error: "Không thể xóa tài sản" };
    }
}
