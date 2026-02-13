
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { compare, hash } from "bcryptjs";

export async function updateProfile(data: { name: string; phone?: string; image?: string }) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: data.name,
                phone: data.phone,
                avatar: data.image
            }
        });

        revalidatePath("/dashboard/settings/profile");
        return { success: true };
    } catch (error) {
        console.error("Failed to update profile", error);
        return { error: "Failed to update profile" };
    }
}

export async function changePassword(current: string, newPass: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user || !user.password) {
            return { error: "User not found or no password set" };
        }

        const isValid = await compare(current, user.password);
        if (!isValid) {
            return { error: "Mật khẩu hiện tại không đúng" };
        }

        const hashedPassword = await hash(newPass, 10);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to change password", error);
        return { error: "Failed to change password" };
    }
}

export async function updateBankInfo(data: { bankName: string; bankAccountNumber: string; bankAccountName: string }) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                bankName: data.bankName,
                bankAccountNumber: data.bankAccountNumber,
                bankAccountName: data.bankAccountName
            }
        });

        revalidatePath("/dashboard/settings/billing");
        return { success: true };
    } catch (error) {
        console.error("Failed to update bank info", error);
        return { error: "Failed to update bank info" };
    }
}
