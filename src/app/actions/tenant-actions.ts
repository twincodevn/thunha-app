"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { tenantSchema } from "@/lib/validators";

export async function updateTenant(formData: FormData) {
    const session = await auth();
    if (!session?.user) {
        return { error: "Unauthorized" };
    }

    const id = formData.get("id") as string;
    const data = {
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email") || undefined,
        idNumber: formData.get("idNumber") || undefined,
        dateOfBirth: formData.get("dateOfBirth"),
        notes: formData.get("notes") || undefined,
    };

    const validated = tenantSchema.safeParse(data);

    if (!validated.success) {
        const error = validated.error.issues[0].message;
        return { error };
    }

    const { name: validName, phone: validPhone, email: validEmail, idNumber: validId, dateOfBirth: validDob, notes: validNotes } = validated.data;

    try {
        // Check for duplicate phone number
        const existingTenant = await prisma.tenant.findFirst({
            where: {
                phone: validPhone,
                userId: session.user.id,
                id: { not: id }, // Exclude current tenant
            },
        });

        if (existingTenant) {
            return { error: "Số điện thoại này đã được sử dụng bởi khách thuê khác" };
        }
        await prisma.tenant.update({
            where: { id, userId: session.user.id },
            data: {
                name: validName,
                phone: validPhone,
                email: validEmail || null,
                idNumber: validId || null,
                dateOfBirth: validDob ? new Date(validDob) : null,
                notes: validNotes || null,
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
