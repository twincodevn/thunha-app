import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;

interface SendPushOptions {
    tenantId: string;
    title: string;
    message: string;
    url?: string;
}

// Internal helper — not authenticated (called server-side only)
export async function sendPushToTenant({
    tenantId,
    title,
    message,
    url,
}: SendPushOptions): Promise<boolean> {
    try {
        if (!ONESIGNAL_REST_API_KEY || ONESIGNAL_REST_API_KEY.startsWith("<")) {
            console.warn("[Push] ONESIGNAL_REST_API_KEY not configured");
            return false;
        }

        // Get the tenant's OneSignal player ID from DB
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { oneSignalPlayerId: true, name: true },
        });

        if (!tenant?.oneSignalPlayerId) {
            // Tenant hasn't subscribed to push yet – that's OK
            return false;
        }

        const payload = {
            app_id: ONESIGNAL_APP_ID,
            include_subscription_uids: [tenant.oneSignalPlayerId],
            headings: { vi: title, en: title },
            contents: { vi: message, en: message },
            ...(url ? { url } : {}),
            chrome_web_icon: "/icons/icon-192x192.png",
        };

        const response = await fetch("https://api.onesignal.com/notifications", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Key ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Push] OneSignal API error:", response.status, errorText);
            return false;
        }

        return true;
    } catch (error) {
        console.error("[Push] sendPushToTenant error:", error);
        return false;
    }
}

// POST /api/push/send — for manual trigger or future webhook
// Body: { tenantId, title, message, url? }
export async function POST(request: NextRequest) {
    try {
        // Verify it's an internal call with a shared secret or from cron
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { tenantId, title, message, url } = body as SendPushOptions;

        if (!tenantId || !title || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const sent = await sendPushToTenant({ tenantId, title, message, url });
        return NextResponse.json({ success: sent });
    } catch (error) {
        console.error("[Push Send] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
