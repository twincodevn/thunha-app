import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVNPayUrl } from "@/lib/vnpay";
import { PLANS, UserPlan } from "@/lib/plans";

const VALID_PLANS: UserPlan[] = ["BASIC", "PRO", "BUSINESS"];

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { plan, bankCode } = body as { plan: UserPlan; bankCode?: string };

        if (!plan || !VALID_PLANS.includes(plan)) {
            return NextResponse.json(
                { error: "Gói không hợp lệ. Chọn BASIC, PRO hoặc BUSINESS." },
                { status: 400 }
            );
        }

        const planConfig = PLANS[plan];

        // Get client IP
        const forwarded = request.headers.get("x-forwarded-for");
        const ipAddr = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

        // Generate unique order ID for this subscription payment
        const orderId = `SUB${Date.now()}${session.user.id.slice(-6).toUpperCase()}`;

        // Create a pending SubscriptionOrder record
        await prisma.subscriptionOrder.create({
            data: {
                userId: session.user.id,
                plan,
                amount: planConfig.price,
                status: "PENDING",
                vnpayTxnRef: orderId,
            },
        });

        // Build VNPay URL — use a subscription-specific return URL
        const subscriptionReturnUrl =
            process.env.VNPAY_SUBSCRIPTION_RETURN_URL ||
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/subscriptions/vnpay/callback`;

        const paymentUrl = createVNPayUrl({
            orderId,
            amount: planConfig.price,
            orderInfo: `Nang cap goi ${planConfig.name} - ThuNha App`,
            ipAddr,
            bankCode,
            returnUrl: subscriptionReturnUrl,
        });

        return NextResponse.json({ paymentUrl, orderId });
    } catch (error) {
        console.error("Subscription VNPay create error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
