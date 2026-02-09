"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateTenant(formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const idNumber = formData.get("idNumber") as string;
    const dateOfBirthStr = formData.get("dateOfBirth") as string;
    const notes = formData.get("notes") as string;

    if (!name || !phone) {
        return { error: "Vui lòng nhập họ tên và số điện thoại" };
    }

    try {
        await prisma.tenant.update({
            where: { id, userId: session.user.id },
            data: {
                name,
                phone,
                email: email || null,
                idNumber: idNumber || null,
                dateOfBirth: dateOfBirthStr ? new Date(dateOfBirthStr) : null,
                notes: notes || null,
            },
        });

        revalidatePath(`/dashboard/tenants/${id}`);
        revalidatePath("/dashboard/tenants");

    } catch (error) {
        console.error("Error updating tenant:", error);
        return { error: "Không thể cập nhật thông tin khách thuê" };
    }

    redirect(`/dashboard/tenants/${id}`);
}
