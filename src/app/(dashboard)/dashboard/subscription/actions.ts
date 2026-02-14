"use server";

import { prisma } from "@/lib/prisma";
import { PLANS, UserPlan } from "@/lib/plans";
import { revalidatePath } from "next/cache";

export async function upgradePlan(userId: string, plan: UserPlan) {
    // In a real app, this would redirect to a checkout page (Stripe/VNPay)
    // For this MVP, we upgrade immediately
    await prisma.user.update({
        where: { id: userId },
        data: {
            plan,
            maxRooms: PLANS[plan].maxRooms
        },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/subscription");
}
