import { NextRequest, NextResponse } from "next/server";
import { sendPushToTenant } from "@/lib/push";

interface SendPushOptions {
    tenantId: string;
    title: string;
    message: string;
    url?: string;
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
