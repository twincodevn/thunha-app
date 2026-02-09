/**
 * Cron Job: Mark Overdue Bills
 * 
 * This endpoint should be called daily by a cron service (e.g., Vercel Cron, GitHub Actions).
 * It marks all PENDING bills with past dueDate as OVERDUE.
 * 
 * Usage: GET /api/cron/check-overdue?secret=YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
