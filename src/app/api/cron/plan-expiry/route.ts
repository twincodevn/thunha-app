import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cron/plan-expiry
// This endpoint should be called by a cron job (e.g., Vercel Cron)
// It downgrades users with expired paid plans back to FREE
export async function GET(request: Request) {
    // Verify cron secret (for production security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();

        // Find all users with expired paid plans
        const expiredUsers = await prisma.user.findMany({
            where: {
                plan: { not: "FREE" },
                planExpiresAt: {
                    not: null,
                    lt: now,
                },
            },
            select: {
                id: true,
                email: true,
                name: true,
                plan: true,
                planExpiresAt: true,
            },
        });

        if (expiredUsers.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No expired plans found",
                processedCount: 0,
                processedAt: new Date().toISOString(),
            });
        }

        // Downgrade all expired users to FREE plan
        const result = await prisma.user.updateMany({
            where: {
                id: { in: expiredUsers.map(u => u.id) },
            },
            data: {
                plan: "FREE",
                maxRooms: 3, // Reset to FREE plan limit
            },
        });

        // Log for monitoring
        console.log(`[Cron] Downgraded ${result.count} users:`,
            expiredUsers.map(u => ({
                id: u.id,
                email: u.email,
                oldPlan: u.plan,
                expiredAt: u.planExpiresAt
            }))
        );

        // TODO: Send email notification to users about plan expiry
        // This would require email service integration

        return NextResponse.json({
            success: true,
            message: `Downgraded ${result.count} users from expired plans`,
            processedCount: result.count,
            users: expiredUsers.map(u => ({
                email: u.email,
                name: u.name,
                oldPlan: u.plan,
                expiredAt: u.planExpiresAt,
            })),
            processedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Cron] Error processing plan expiry:", error);
        return NextResponse.json(
            { error: "Failed to process plan expiry" },
            { status: 500 }
        );
    }
}
