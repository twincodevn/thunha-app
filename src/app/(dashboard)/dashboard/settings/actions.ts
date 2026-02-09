"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveBankAccount(formData: FormData): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const bankName = formData.get("bankName") as string;
    const bankAccountNumber = formData.get("bankAccountNumber") as string;
    const bankAccountName = formData.get("bankAccountName") as string;

    if (!bankName || !bankAccountNumber) {
        throw new Error("Vui lòng nhập đủ thông tin ngân hàng");
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            bankName,
            bankAccountNumber,
            bankAccountName: bankAccountName?.toUpperCase() || null,
        },
    });

    revalidatePath("/dashboard/settings");
    redirect("/dashboard/settings?saved=true");
}
