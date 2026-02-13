
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getTemplates() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return prisma.contractTemplate.findMany({
        where: { userId: session.user.id, isActive: true },
        orderBy: { createdAt: "desc" },
    });
}
