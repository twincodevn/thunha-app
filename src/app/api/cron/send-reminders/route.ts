import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentReminder } from "@/lib/email";
import { sendBillOverdueZNS, formatCurrencyVND, formatDateVN } from "@/lib/zalo";

// GET /api/cron/send-reminders
// This endpoint should be called by a cron job (e.g., Vercel Cron)
// It sends email reminders for all OVERDUE bills
export async function GET(request: Request) {
    // Verify cron secret (for production security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Find all OVERDUE bills with tenant info via roomTenant relation
        const overdueBills = await prisma.bill.findMany({
            where: {
                status: "OVERDUE",
            },
            include: {
                roomTenant: {
                    include: {
                        tenant: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            },
                        },
                        room: {
                            select: {
                                roomNumber: true,
                                property: {
                                    select: {
                                        name: true,
                                        userId: true,
                                    },
                                },
                            },
                        },
                    },
                },
                invoice: {
                    select: {
                        token: true,
                    },
                },
            },
        });

        // Filter bills where tenant has email
        const billsWithEmail = overdueBills.filter(
            (bill) => bill.roomTenant.tenant.email
        );

        if (billsWithEmail.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No overdue bills with tenant emails found",
                sentCount: 0,
                processedAt: new Date().toISOString(),
            });
        }

        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const bill of billsWithEmail) {
            const daysOverdue = Math.floor(
                (now.getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24)
            );

            // Only send if overdue by at least 1 day
            if (daysOverdue < 1) continue;

            // Generate invoice URL using invoice token or bill id
            const invoiceToken = bill.invoice?.token || bill.id;
            const invoiceUrl = `${appUrl}/invoice/${invoiceToken}`;

            const tenant = bill.roomTenant.tenant;
            const room = bill.roomTenant.room;

            try {
                const result = await sendPaymentReminder({
                    to: tenant.email!,
                    tenantName: tenant.name,
                    propertyName: room.property.name,
                    roomNumber: room.roomNumber,
                    month: bill.month,
                    year: bill.year,
                    total: bill.total,
                    daysOverdue,
                    invoiceUrl,
                });

                if (result.success) {
                    successCount++;
                    results.push({
                        billId: bill.id,
                        tenantEmail: tenant.email,
                        status: "sent",
                        messageId: (result.data as any)?.id,
                    });

                    // 🔔 Also send Zalo ZNS (best-effort, don't fail if unavailable)
                    if (tenant.phone) {
                        const landlordUserId = room.property.userId;
                        sendBillOverdueZNS(landlordUserId, tenant.phone, {
                            tenant_name: tenant.name,
                            room_number: room.roomNumber,
                            property_name: room.property.name,
                            amount: formatCurrencyVND(bill.total),
                            days_overdue: String(daysOverdue),
                            invoice_url: invoiceUrl,
                        }).catch((e) => console.warn("[ZNS] Send failed:", e));
                    }
                } else {
                    failCount++;
                    results.push({
                        billId: bill.id,
                        tenantEmail: tenant.email,
                        status: "failed",
                        error: result.error,
                    });
                }
            } catch (error) {
                failCount++;
                results.push({
                    billId: bill.id,
                    tenantEmail: tenant.email,
                    status: "error",
                    error: String(error),
                });
            }
        }

        console.log(`[Cron] Sent ${successCount} reminders, ${failCount} failed`);

        return NextResponse.json({
            success: true,
            message: `Sent ${successCount} reminders, ${failCount} failed`,
            sentCount: successCount,
            failCount,
            results,
            processedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Cron] Error sending reminders:", error);
        return NextResponse.json(
            { error: "Failed to send reminders" },
            { status: 500 }
        );
    }
}
