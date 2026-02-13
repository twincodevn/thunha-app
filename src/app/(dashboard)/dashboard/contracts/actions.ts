"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const templateSchema = z.object({
    name: z.string().min(1, "Tên mẫu không được để trống"),
    content: z.string().min(1, "Nội dung không được để trống"),
});

export async function createContractTemplate(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const content = formData.get("content") as string;

    const validated = templateSchema.safeParse({ name, content });
    if (!validated.success) {
        return { error: "Dữ liệu không hợp lệ" };
    }

    try {
        await prisma.contractTemplate.create({
            data: {
                userId: session.user.id,
                name,
                content,
            },
        });
    } catch (error) {
        console.error("Create template error:", error);
        return { error: "Không thể tạo mẫu hợp đồng" };
    }

    revalidatePath("/dashboard/contracts/templates");
    return { success: true };
}

export async function updateContractTemplate(id: string, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const content = formData.get("content") as string;
    const isActive = formData.get("isActive") === "true";

    try {
        await prisma.contractTemplate.update({
            where: { id, userId: session.user.id },
            data: { name, content, isActive },
        });
    } catch (error) {
        return { error: "Không thể cập nhật mẫu" };
    }

    revalidatePath("/dashboard/contracts/templates");
    revalidatePath(`/dashboard/contracts/templates/${id}`);
    return { success: true };
}
