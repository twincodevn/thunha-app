/**
 * Cron Job: Downgrade Expired Subscriptions
 * 
 * This endpoint should be called daily by a cron service.
 * It downgrades users with expired planExpiresAt to FREE plan.
 * 
 * Usage: GET /api/cron/check-subscriptions?secret=YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/constants";

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get("secret");

        if (secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();

        // Find users with expired subscriptions (not FREE)
        const expiredUsers = await prisma.user.findMany({
            where: {
                plan: { not: "FREE" },
                planExpiresAt: {
                    lt: now,
                },
            },
            select: {
                id: true,
                email: true,
                name: true,
                plan: true,
            },
        });

        // Downgrade each expired user
        type ExpiredUser = typeof expiredUsers[number];
        const updatePromises = expiredUsers.map((user: ExpiredUser) =>
            prisma.user.update({
                where: { id: user.id },
                data: {
                    plan: "FREE",
                    maxRooms: PLAN_LIMITS.FREE,
                    planExpiresAt: null,
                },
            })
        );

        await Promise.all(updatePromises);

        console.log(`[CRON] Downgraded ${expiredUsers.length} expired subscriptions`);

        // Log downgraded users for monitoring
        for (const user of expiredUsers) {
            console.log(`[CRON] Downgraded: ${user.email} from ${user.plan} to FREE`);
        }

        return NextResponse.json({
            success: true,
            downgradedCount: expiredUsers.length,
            downgradedUsers: expiredUsers.map((u: ExpiredUser) => u.email),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[CRON] Check subscriptions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
