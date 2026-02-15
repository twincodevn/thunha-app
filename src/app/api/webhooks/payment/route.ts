import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * VietQR Webhook — auto-confirm payment
 * Banks can send payment notification via webhook
 * 
 * Expected payload format (simplified):
 * {
 *   "transactionId": "FT12345",
 *   "amount": 3500000,
 *   "description": "TN ABC123 P101 T1/2026",
 *   "bankAccount": "1234567890",
 *   "timestamp": "2026-01-15T10:30:00Z"
 * }
 * 
 * The bill is identified by the short ID in the description: "TN {shortId} P{room} T{month}/{year}"
 */
export async function POST(request: NextRequest) {
    // Verify webhook secret
    const secret = request.headers.get("x-webhook-secret");
    if (secret !== process.env.PAYMENT_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { transactionId, amount, description } = body;

        if (!transactionId || !amount || !description) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Parse bill short ID from description: "TN {shortId} P{room} T{month}/{year}"
        const match = description.match(/TN\s+([A-Z0-9]+)/i);
        if (!match) {
            console.log("[Webhook] Could not parse bill ID from description:", description);
            return NextResponse.json({ error: "Could not parse bill ID" }, { status: 400 });
        }

        const shortId = match[1].toLowerCase();

        // Find bill with matching ID suffix
        const bills = await prisma.bill.findMany({
            where: {
                status: { in: ["PENDING", "OVERDUE"] },
            },
            select: { id: true, total: true },
        });

        const matchingBill = bills.find((b) => b.id.slice(-6).toLowerCase() === shortId);
        if (!matchingBill) {
            console.log("[Webhook] No bill found for shortId:", shortId);
            return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        }

        // Check for duplicate transaction
        const existing = await prisma.payment.findFirst({
            where: { transactionId },
        });
        if (existing) {
            return NextResponse.json({ message: "Already processed" }, { status: 200 });
        }

        // Record payment
        await prisma.payment.create({
            data: {
                billId: matchingBill.id,
                amount,
                method: "BANK_TRANSFER",
                transactionId,
                note: `Auto-confirmed via VietQR webhook`,
            },
        });

        // Check if fully paid
        const totalPayments = await prisma.payment.aggregate({
            where: { billId: matchingBill.id },
            _sum: { amount: true },
        });

        if ((totalPayments._sum.amount || 0) >= matchingBill.total) {
            await prisma.bill.update({
                where: { id: matchingBill.id },
                data: { status: "PAID" },
            });
        }

        console.log(`[Webhook] Payment recorded: ${transactionId} -> bill ${matchingBill.id} (${amount})`);
        return NextResponse.json({ success: true, billId: matchingBill.id });
    } catch (error) {
        console.error("[Webhook] Error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
