import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS, UserPlan } from "@/lib/plans";

// Feature keys that map to plan config flags
export type FeatureKey =
    | "canExportPdf"
    | "canSendReminders"
    | "canUseVnpay"
    | "hasAdvancedReports"
    | "hasPrioritySupport";

/**
 * Get current plan for a user (reads from DB).
 * Also auto-downgrades if the plan has expired.
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, planExpiresAt: true },
    });

    if (!user) return "FREE";

    // Auto-downgrade expired plans
    if (user.plan !== "FREE" && user.planExpiresAt && user.planExpiresAt < new Date()) {
        await prisma.user.update({
            where: { id: userId },
            data: { plan: "FREE", planExpiresAt: null, maxRooms: PLANS.FREE.maxRooms },
        });
        return "FREE";
    }

    return user.plan as UserPlan;
}

/**
 * Check if a plan has access to a specific feature.
 */
export function checkFeature(plan: UserPlan, feature: FeatureKey): boolean {
    return !!PLANS[plan]?.[feature];
}

/**
 * Returns a 403 NextResponse if the user's plan does not have the feature.
 * Returns null if access is allowed.
 *
 * Usage in API route:
 *   const gate = await requireFeature(session.user.id, "canExportPdf");
 *   if (gate) return gate;
 */
export async function requireFeature(
    userId: string,
    feature: FeatureKey
): Promise<NextResponse | null> {
    const plan = await getUserPlan(userId);
    if (checkFeature(plan, feature)) return null;

    const requiredPlan = getMinimumPlanForFeature(feature);
    return NextResponse.json(
        {
            error: "PLAN_REQUIRED",
            message: `Tính năng này yêu cầu gói ${requiredPlan} trở lên.`,
            requiredPlan,
            currentPlan: plan,
        },
        { status: 403 }
    );
}

/**
 * Returns a 403 if the user has reached their room limit.
 */
export async function requireRoomSlot(userId: string): Promise<NextResponse | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, planExpiresAt: true, maxRooms: true, properties: { select: { rooms: { select: { id: true } } } } },
    });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const plan = (user.plan ?? "FREE") as UserPlan;
    const totalRooms = user.properties.reduce((sum, p) => sum + p.rooms.length, 0);
    const limit = PLANS[plan]?.maxRooms ?? 3;

    if (totalRooms >= limit) {
        const requiredPlan = getMinimumPlanForFeature("canUseVnpay"); // just reuse helper context
        return NextResponse.json(
            {
                error: "ROOM_LIMIT_REACHED",
                message: `Gói ${plan} chỉ cho phép tối đa ${limit === 9999 ? "không giới hạn" : limit} phòng. Nâng cấp để thêm phòng.`,
                currentPlan: plan,
                limit,
                current: totalRooms,
            },
            { status: 403 }
        );
    }

    return null;
}

/**
 * Returns the minimum plan name that has a given feature.
 */
function getMinimumPlanForFeature(feature: FeatureKey): string {
    const order: UserPlan[] = ["FREE", "BASIC", "PRO", "BUSINESS"];
    for (const plan of order) {
        if (PLANS[plan]?.[feature]) {
            return PLANS[plan].name;
        }
    }
    return "Business";
}
