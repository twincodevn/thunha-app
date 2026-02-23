"use server";

import { prisma } from "@/lib/prisma";
import { PLANS, UserPlan } from "@/lib/plans";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";

export async function upgradePlan(userId: string, plan: UserPlan) {
    const expiresAt = plan === "FREE" ? null : addDays(new Date(), 30);
    await prisma.user.update({
        where: { id: userId },
        data: {
            plan,
            planExpiresAt: expiresAt,
            maxRooms: PLANS[plan].maxRooms,
        },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/subscription");
}

/** Call this on every protected page to auto-downgrade expired plans. */
export async function checkAndEnforcePlanExpiry(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, planExpiresAt: true },
    });
    if (!user) return;
    if (user.plan !== "FREE" && user.planExpiresAt && user.planExpiresAt < new Date()) {
        await prisma.user.update({
            where: { id: userId },
            data: { plan: "FREE", planExpiresAt: null, maxRooms: PLANS.FREE.maxRooms },
        });
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/subscription");
    }
}
