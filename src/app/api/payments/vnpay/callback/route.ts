import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVNPayCallback, getVNPayMessage } from "@/lib/vnpay";
import { calculateNewScore } from "@/lib/scoring-engine";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Convert searchParams to object
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            params[key] = value;
        });

        // Verify callback signature
        const { isValid, responseCode } = verifyVNPayCallback(params);

        if (!isValid) {
            return NextResponse.redirect(
                new URL("/dashboard/billing?payment=failed&message=Invalid+signature", request.url)
            );
        }

        const orderId = params.vnp_TxnRef;
        const vnpAmount = parseInt(params.vnp_Amount || "0") / 100;
        const transactionNo = params.vnp_TransactionNo;

        // Find payment by transaction ID (orderId)
        const payment = await prisma.payment.findFirst({
            where: { transactionId: orderId },
            include: { bill: true },
        });

        if (!payment) {
            return NextResponse.redirect(
                new URL("/dashboard/billing?payment=failed&message=Payment+not+found", request.url)
            );
        }

        // Check if payment was successful
        if (responseCode === "00") {
            // Update payment with VNPay transaction number
            await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    transactionId: transactionNo,
                    note: `VNPay thanh toán thành công - Mã GD: ${transactionNo}`,
                },
            });

            // Check if bill is fully paid
            const allPayments = await prisma.payment.aggregate({
                where: { billId: payment.billId },
                _sum: { amount: true },
            });

            const totalPaid = allPayments._sum.amount || 0;

            if (totalPaid >= payment.bill.total) {
                await prisma.bill.update({
                    where: { id: payment.billId },
                    data: { status: "PAID" },
                });

                // Credit score: fetch tenantId then +5
                const billWithTenant = await prisma.bill.findUnique({
                    where: { id: payment.billId },
                    select: { roomTenant: { select: { tenantId: true } } },
                });
                const tenantId = billWithTenant?.roomTenant?.tenantId;
                if (tenantId) {
                    calculateNewScore({
                        tenantId,
                        pointsChange: 5,
                        reason: `Thanh toán đúng hạn hóa đơn qua VNPay`,
                    }).catch(() => { });
                }
            }

            return NextResponse.redirect(
                new URL(
                    `/dashboard/billing?payment=success&amount=${vnpAmount}&billId=${payment.billId}`,
                    request.url
                )
            );
        } else {
            // Payment failed - delete the pending payment record
            await prisma.payment.delete({
                where: { id: payment.id },
            });

            const message = encodeURIComponent(getVNPayMessage(responseCode));
            return NextResponse.redirect(
                new URL(`/dashboard/billing?payment=failed&message=${message}`, request.url)
            );
        }
    } catch (error) {
        console.error("VNPay callback error:", error);
        return NextResponse.redirect(
            new URL("/dashboard/billing?payment=failed&message=Server+error", request.url)
        );
    }
}
