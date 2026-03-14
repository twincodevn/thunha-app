import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculateNewScore } from "@/lib/scoring-engine";

/**
 * SePay Webhook — Auto Payment Reconciliation for TPBank
 *
 * How it works:
 * 1. Chủ nhà liên kết tài khoản TPBank với SePay (app miễn phí)
 * 2. Mỗi hóa đơn sinh ra 1 VietQR chứa nội dung CK riêng: "TN-{billId6}"
 * 3. Khi khách quét mã chuyển tiền → SePay bắn Webhook vào endpoint này
 * 4. Hệ thống tự động khớp bill → tạo Payment → cập nhật trạng thái PAID
 *
 * SePay Webhook Payload format:
 * {
 *   "id": 12345,
 *   "gateway": "TPBank",
 *   "transactionDate": "2026-03-01 10:30:00",
 *   "accountNumber": "12345678901",
 *   "code": null,
 *   "content": "TN-ABC123 phong 101 thang 3",  ← Contains our bill code
 *   "transferType": "in",
 *   "transferAmount": 3500000,
 *   "accumulated": 3500000,
 *   "subAccount": null,
 *   "referenceCode": "FT2603015200001",
 *   "description": "TN-ABC123"
 * }
 */
export async function POST(request: NextRequest) {
    // ─── Extract SePay apiKey header ───────────────────────────────
    const authHeader = request.headers.get("Authorization") || "";
    // Sử dụng Regex để match mọi case-insensitive của chữ "apikey"
    const matchApiKey = authHeader.match(/^Apikey\s+(.+)$/i);
    const apiKey = matchApiKey ? matchApiKey[1].trim() : authHeader.replace(/^Bearer\s+/i, "").trim();
    const legacySecret = request.headers.get("x-webhook-secret");

    try {
        const body = await request.json();

        // ─── Only process incoming transfers ───────────────────────────────────
        if (body.transferType !== "in") {
            return NextResponse.json({ message: "Skipped: outgoing transfer" });
        }

        const {
            referenceCode,  // SePay unique transaction ID
            content,        // "Nội dung chuyển khoản" field
            description,    // sometimes SePay uses this field
            transferAmount,
            transactionDate,
            gateway,
            accountNumber,
        } = body;

        const amount: number = transferAmount;
        const transactionId: string = referenceCode || `SEPAY-${Date.now()}`;
        const rawContent: string = (content || description || "").trim();

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        // ─── Idempotency: Prevent duplicate processing ─────────────────────────
        const existing = await prisma.payment.findFirst({
            where: { transactionId },
        });
        if (existing) {
            console.log(`[Webhook] Already processed: ${transactionId}`);
            return NextResponse.json({ message: "Already processed" });
        }

        // ─── Parse Bill ID from transfer content ──────────────────────────────
        // Ngân hàng thường remove mọi dấu cách. 
        // VD: TN-ABCDEF -> TNABCDEF, THUNHA ABCDEF -> THUNHAABCDEF
        // Regex này lỏng hơn: tìm (TN hoặc THUNHA hoặc HD) đứng trước 6-10 ký tự chữ/số
        const codeMatch = rawContent.match(/(?:TN|THUNHA|HD)[-\s]*([A-Z0-9]{6,10})/i);
        if (!codeMatch) {
            console.log(`[Webhook] No bill code in content: "${rawContent}". Logging unmatched.`);
            return NextResponse.json({ message: "No bill code found in content", content: rawContent });
        }

        const shortId = codeMatch[1].toLowerCase();

        // ─── Find pending bill and its owner (Landlord) ──────────────────────────
        const matchedBill = await prisma.bill.findFirst({
            where: {
                status: { in: ["PENDING", "OVERDUE"] },
                id: { endsWith: shortId },
            },
            select: {
                id: true,
                total: true,
                month: true,
                year: true,
                roomTenant: {
                    select: {
                        tenantId: true,
                        tenant: { select: { id: true, phone: true, name: true } },
                        room: {
                            select: {
                                roomNumber: true,
                                property: {
                                    select: {
                                        name: true,
                                        userId: true,
                                        user: {
                                            select: {
                                                id: true,
                                                sepayApiKey: true,
                                            }
                                        }
                                    }
                                },
                            },
                        },
                    },
                },
            },
        }) as any;

        if (!matchedBill) {
            console.log(`[Webhook] No pending bill found for shortId: ${shortId}`);
            return NextResponse.json({ message: "No matching bill found", shortId });
        }

        // ─── Dynamic Authorization Check ───────────────────────────────────────
        const landlord = matchedBill.roomTenant.room.property.user;
        const savedApiKey = landlord.sepayApiKey;

        const isAuthorized =
            (savedApiKey && apiKey === savedApiKey) ||
            (apiKey && apiKey === process.env.SEPAY_API_KEY) ||
            (legacySecret && legacySecret === process.env.PAYMENT_WEBHOOK_SECRET);

        if (!isAuthorized) {
            console.warn(`[Webhook] Unauthorized request for bill ${matchedBill.id} (Landlord: ${landlord.id}) - Expected: ${savedApiKey}, Got: ${apiKey}`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ─── Calculate payment status ──────────────────────────────────────────
        const existingPaymentsAgg = await prisma.payment.aggregate({
            where: { billId: matchedBill.id },
            _sum: { amount: true },
        });
        const previouslyPaid = existingPaymentsAgg._sum.amount || 0;
        const totalPaidAfterThis = previouslyPaid + amount;
        const newStatus = totalPaidAfterThis >= matchedBill.total ? "PAID" : "PENDING";

        // ─── Atomic transaction: Record Payment + Update Bill + AuditLog ───────
        const landlordUserId = matchedBill.roomTenant.room.property.userId;
        await prisma.$transaction([
            // 1. Create payment record
            prisma.payment.create({
                data: {
                    billId: matchedBill.id,
                    amount,
                    method: "BANK_TRANSFER",
                    transactionId,
                    note: `Tự động xác nhận qua SePay • ${gateway || "TPBank"} • ${transactionDate || new Date().toISOString()}`,
                    paidAt: transactionDate ? new Date(transactionDate) : new Date(),
                },
            }),
            // 2. Update bill status
            prisma.bill.update({
                where: { id: matchedBill.id },
                data: { status: newStatus as any },
            }),
            // 3. Enterprise Audit Ledger — Immutable record
            (prisma as any).auditLog.create({
                data: {
                    userId: landlordUserId,
                    action: "PAYMENT_AUTO_CONFIRMED",
                    entityType: "Payment",
                    entityId: matchedBill.id,
                    details: {
                        amount,
                        transactionId,
                        gateway: gateway || "TPBank",
                        accountNumber,
                        rawContent,
                        newStatus,
                        autoConfirmed: true,
                    },
                },
            }),
        ]);

        console.log(
            `[Webhook] ✅ Auto-confirmed: ${transactionId} → Bill ${matchedBill.id} (+${amount.toLocaleString("vi-VN")}đ) → ${newStatus}`
        );

        // ─── Push notification to tenant ──────────────────────────────────────
        const tenantId = matchedBill.roomTenant.tenantId;
        const roomNumber = matchedBill.roomTenant.room.roomNumber;
        const propertyName = matchedBill.roomTenant.room.property.name;
        const { month, year } = matchedBill;

        if (tenantId) {
            await prisma.notification.create({
                data: {
                    tenantId,
                    title: "✅ Xác nhận thanh toán thành công",
                    message: `Phòng ${roomNumber} - ${propertyName}: ${amount.toLocaleString("vi-VN")}đ tháng ${month}/${year} đã được ghi nhận.`,
                    type: "BILL",
                    link: "/portal/bills",
                },
            }).catch(() => { }); // Non-blocking
        }

        // ─── Notify landlord if PAID ───────────────────────────────────────────
        if (newStatus === "PAID") {
            await prisma.notification.create({
                data: {
                    userId: landlordUserId,
                    title: "💰 Tiền về tự động!",
                    message: `P.${roomNumber} đã TT đủ hóa đơn T${month}/${year}: ${matchedBill.total.toLocaleString("vi-VN")}đ.`,
                    type: "BILL",
                    link: `/dashboard/billing/${matchedBill.id}`,
                },
            }).catch(() => { });
        }

        // ─── Credit Score: +5 for on-time, update for PAID ──────────────────
        if (newStatus === "PAID" && tenantId) {
            const daysDiff = matchedBill
                ? Math.floor((Date.now() - new Date(matchedBill.year + "-" + String(matchedBill.month).padStart(2, "0") + "-01").getTime()) / (1000 * 60 * 60 * 24))
                : 0;
            const isLate = daysDiff > 30;
            calculateNewScore({
                tenantId,
                pointsChange: isLate ? -15 : 5,
                reason: isLate
                    ? `Thanh toán trễ hóa đơn T${month}/${year}`
                    : `Thanh toán đúng hạn hóa đơn T${month}/${year}`,
            }).catch(() => { }); // Non-blocking
        }

        // Note: revalidatePath may not work reliably for external webhook requests.
        // Using try-catch to prevent webhook failure if revalidation fails.
        try {
            revalidatePath("/dashboard/billing");
            revalidatePath(`/dashboard/billing/${matchedBill.id}`);
        } catch (e) {
            // Non-critical: cache will refresh on next user visit
        }

        return NextResponse.json({
            success: true,
            billId: matchedBill.id,
            amount,
            status: newStatus,
            message: `Đã ghi nhận ${amount.toLocaleString("vi-VN")}đ → Hóa đơn ${newStatus}`,
        });
    } catch (error: any) {
        console.error("[Webhook] Error:", error);
        return NextResponse.json({ error: "Internal error", detail: error?.message }, { status: 500 });
    }
}

// SePay may also send GET to verify endpoint
export async function GET() {
    return NextResponse.json({ status: "SePay Webhook endpoint active ✅" });
}
