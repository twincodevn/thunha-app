import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVNPayUrl } from "@/lib/vnpay";
import { requireFeature } from "@/lib/feature-gate";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Feature gate: VNPay bill payment requires PRO+
        const gate = await requireFeature(session.user.id, "canUseVnpay");
        if (gate) return gate;

        const body = await request.json();
        const { billId, bankCode } = body;

        if (!billId) {
            return NextResponse.json({ error: "Bill ID is required" }, { status: 400 });
        }

        // Get bill and verify ownership
        const bill = await prisma.bill.findFirst({
            where: {
                id: billId,
                roomTenant: { room: { property: { userId: session.user.id } } },
            },
            include: {
                roomTenant: {
                    include: {
                        room: { include: { property: true } },
                        tenant: true,
                    },
                },
            },
        });

        if (!bill) {
            return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        }

        if (bill.status === "PAID") {
            return NextResponse.json(
                { error: "Hóa đơn đã được thanh toán" },
                { status: 400 }
            );
        }

        // Calculate remaining amount
        const payments = await prisma.payment.aggregate({
            where: { billId },
            _sum: { amount: true },
        });
        const paidAmount = payments._sum.amount || 0;
        const remainingAmount = bill.total - paidAmount;

        if (remainingAmount <= 0) {
            return NextResponse.json(
                { error: "Hóa đơn đã được thanh toán đầy đủ" },
                { status: 400 }
            );
        }

        // Get client IP
        const forwarded = request.headers.get("x-forwarded-for");
        const ipAddr = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

        // Generate unique order ID
        const orderId = `THUNHA${Date.now()}${bill.id.slice(-6)}`;

        // Create payment record in pending state
        const payment = await prisma.payment.create({
            data: {
                billId,
                amount: remainingAmount,
                method: "VNPAY",
                transactionId: orderId,
                note: "Đang chờ thanh toán VNPay",
            },
        });

        // Create VNPay URL
        const paymentUrl = createVNPayUrl({
            orderId,
            amount: remainingAmount,
            orderInfo: `Thanh toan hoa don ${bill.roomTenant.room.property.name} - Phong ${bill.roomTenant.room.roomNumber} - T${bill.month}/${bill.year}`,
            ipAddr,
            bankCode,
        });

        return NextResponse.json({
            paymentUrl,
            orderId,
            paymentId: payment.id,
            amount: remainingAmount,
        });
    } catch (error) {
        console.error("VNPay create error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
