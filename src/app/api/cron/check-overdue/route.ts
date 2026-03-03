/**
 * Cron Job: Mark Overdue Bills
 *
 * This endpoint should be called daily by a cron service (e.g., Vercel Cron, GitHub Actions).
 * It marks all PENDING bills with past dueDate as OVERDUE and deducts credit scores.
 *
 * Usage: GET /api/cron/check-overdue?secret=YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNewScore } from "@/lib/scoring-engine";

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get("secret");

        if (secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find and update overdue bills
        const result = await prisma.bill.updateMany({
            where: {
                status: "PENDING",
                dueDate: {
                    lt: today,
                },
            },
            data: {
                status: "OVERDUE",
            },
        });

        console.log(`[CRON] Marked ${result.count} bills as OVERDUE`);

        // Deduct credit scores for tenants with overdue bills (-30 each)
        if (result.count > 0) {
            const overdueBills = await prisma.bill.findMany({
                where: {
                    status: "OVERDUE",
                    dueDate: { lt: today },
                },
                select: {
                    id: true,
                    month: true,
                    year: true,
                    roomTenant: { select: { tenantId: true } },
                },
            });

            for (const bill of overdueBills) {
                const tenantId = bill.roomTenant?.tenantId;
                if (tenantId) {
                    calculateNewScore({
                        tenantId,
                        pointsChange: -30,
                        reason: `Hóa đơn T${bill.month}/${bill.year} quá hạn thanh toán`,
                    }).catch(() => { });
                }
            }
        }

        return NextResponse.json({
            success: true,
            updatedCount: result.count,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[CRON] Check overdue error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
