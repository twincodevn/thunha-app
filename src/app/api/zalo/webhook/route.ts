import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/zalo/webhook
 * Zalo gửi events đến đây (user follow OA, user nhắn tin, etc.)
 * 
 * Dùng để:
 * - Lưu zaloUserId khi khách thuê nhắn tin lần đầu vào OA
 * - Nhận tin nhắn từ khách thuê
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-zevent-signature") || "";

        // Verify webhook signature
        const appSecret = process.env.ZALO_APP_SECRET || "";
        if (appSecret) {
            const expectedSig = crypto
                .createHmac("sha256", appSecret)
                .update(body)
                .digest("hex");

            if (signature !== expectedSig) {
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        const event = JSON.parse(body);
        const eventName = event.event_name;

        console.log(`[Zalo Webhook] Event: ${eventName}`, event);

        // Xử lý event user gửi tin (lần đầu → lưu Zalo user ID)
        if (eventName === "user_send_text" || eventName === "follow") {
            const zaloUserId = event.sender?.id;
            const senderPhone = event.user_id_by_app;

            if (zaloUserId && senderPhone) {
                // Tìm khách thuê theo số điện thoại
                const normalizedPhone = senderPhone;
                await prisma.tenant.updateMany({
                    where: {
                        phone: {
                            in: [
                                // Thử nhiều format
                                normalizedPhone,
                                "0" + normalizedPhone.slice(2), // 849xxx → 09xxx
                            ],
                        },
                    },
                    data: { zaloUserId },
                });
            }
        }

        // Zalo yêu cầu response 200 trong vòng 5 giây
        return NextResponse.json({ error: 0 });
    } catch (err) {
        console.error("[Zalo Webhook] Error:", err);
        return NextResponse.json({ error: 0 }); // Vẫn trả 200 để Zalo không retry
    }
}

/**
 * GET /api/zalo/webhook
 * Zalo dùng để verify webhook URL khi cấu hình trên portal
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const challenge = searchParams.get("challenge");
    return NextResponse.json({ challenge });
}
