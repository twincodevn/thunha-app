import { prisma } from "@/lib/prisma";

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY!;

interface SendPushOptions {
    tenantId: string;
    title: string;
    message: string;
    url?: string;
}

/**
 * Gửi Web Push notification tới một tenant cụ thể qua OneSignal REST API.
 * Best-effort: fails silently nếu tenant chưa subscribe hoặc key chưa config.
 */
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

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { oneSignalPlayerId: true },
        });

        if (!tenant?.oneSignalPlayerId) {
            return false; // tenant chưa subscribe push
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
