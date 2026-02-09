import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cron/overdue-bills
// This endpoint should be called by a cron job (e.g., Vercel Cron or external service)
// It marks all PENDING bills past their due date as OVERDUE
export async function GET(request: Request) {
    // Verify cron secret (for production security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find all PENDING bills with due date before today
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

        console.log(`[Cron] Marked ${result.count} bills as OVERDUE`);

        return NextResponse.json({
            success: true,
            message: `Marked ${result.count} bills as overdue`,
            updatedCount: result.count,
            processedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Cron] Error updating overdue bills:", error);
        return NextResponse.json(
            { error: "Failed to process overdue bills" },
            { status: 500 }
        );
    }
}
