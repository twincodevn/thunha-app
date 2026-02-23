import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVNPayCallback, getVNPayMessage } from "@/lib/vnpay";
import { PLANS, UserPlan } from "@/lib/plans";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            params[key] = value;
        });

        // Verify VNPay HMAC signature
        const { isValid, responseCode } = verifyVNPayCallback(params);

        const baseUrl = new URL(request.url).origin;

        if (!isValid) {
            return NextResponse.redirect(
                new URL("/dashboard/subscription?payment=failed&message=Invalid+signature", baseUrl)
            );
        }

        const orderId = params.vnp_TxnRef;
        const transactionNo = params.vnp_TransactionNo;

        // Find the pending subscription order
        const order = await prisma.subscriptionOrder.findUnique({
            where: { vnpayTxnRef: orderId },
        });

        if (!order) {
            return NextResponse.redirect(
                new URL("/dashboard/subscription?payment=failed&message=Order+not+found", baseUrl)
            );
        }

        if (responseCode === "00") {
            // Payment successful — activate plan
            const plan = order.plan as UserPlan;
            const planConfig = PLANS[plan];

            await prisma.$transaction([
                // Mark order as paid
                prisma.subscriptionOrder.update({
                    where: { id: order.id },
                    data: {
                        status: "PAID",
                        vnpayTxnNo: transactionNo,
                        paidAt: new Date(),
                    },
                }),
                // Upgrade user plan
                prisma.user.update({
                    where: { id: order.userId },
                    data: {
                        plan,
                        planExpiresAt: addDays(new Date(), 30),
                        maxRooms: planConfig.maxRooms,
                    },
                }),
            ]);

            revalidatePath("/dashboard");
            revalidatePath("/dashboard/subscription");

            return NextResponse.redirect(
                new URL(
                    `/dashboard/subscription?payment=success&plan=${plan}`,
                    baseUrl
                )
            );
        } else {
            // Payment failed
            await prisma.subscriptionOrder.update({
                where: { id: order.id },
                data: { status: "FAILED" },
            });

            const message = encodeURIComponent(getVNPayMessage(responseCode));
            return NextResponse.redirect(
                new URL(`/dashboard/subscription?payment=failed&message=${message}`, baseUrl)
            );
        }
    } catch (error) {
        console.error("Subscription VNPay callback error:", error);
        const baseUrl = new URL(request.url).origin;
        return NextResponse.redirect(
            new URL("/dashboard/subscription?payment=failed&message=Server+error", baseUrl)
        );
    }
}
