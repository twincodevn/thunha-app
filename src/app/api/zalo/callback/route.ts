import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForToken, verifyZaloWebhookSignature } from "@/lib/zalo";
import { cookies } from "next/headers";

/**
 * GET /api/zalo/callback?code=xxx&state=userId&oa_id=xxx
 * Zalo redirects here after user authorizes the OA.
 * Exchange code for access_token and save to DB.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId we passed
    const oaId = searchParams.get("oa_id");
    const appUrl = req.nextUrl.origin;

    // Lấy verifier từ cookie cho PKCE
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get("zalo_code_verifier")?.value;

    if (!code || !state) {
        return NextResponse.redirect(`${appUrl}/dashboard/settings/zalo?error=missing_params`);
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: state } });
    if (!user) {
        return NextResponse.redirect(`${appUrl}/dashboard/settings/zalo?error=invalid_state`);
    }

    // Exchange code for token (có hỗ trợ PKCE verifier)
    const tokenData = await exchangeCodeForToken(code, codeVerifier);

    // Dọn dẹp cookie
    cookieStore.delete("zalo_code_verifier");
    if (!tokenData) {
        return NextResponse.redirect(`${appUrl}/dashboard/settings/zalo?error=token_exchange_failed`);
    }

    const expiry = new Date(Date.now() + tokenData.expires_in * 1000);

    await prisma.user.update({
        where: { id: state },
        data: {
            zaloOaAccessToken: tokenData.access_token,
            zaloOaRefreshToken: tokenData.refresh_token,
            zaloOaTokenExpiry: expiry,
            ...(oaId ? { zaloOaId: oaId } : {}),
        },
    });

    return NextResponse.redirect(`${appUrl}/dashboard/settings/zalo?success=connected`);
}

/**
 * POST /api/zalo/callback
 * Zalo OA Webhook: Receive events like user messages, send status, etc.
 * Zalo requires this to return 200 OK for verification.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const appId = (process.env.ZALO_APP_ID || "").trim();
        const mac = req.headers.get("x-zalo-signature") || req.headers.get("mac") || "";

        // Zalo OA Webhook v4 sends 'mac' header or 'x-zalo-signature' depending on version
        // Verification logic:
        const isValid = verifyZaloWebhookSignature(appId, JSON.stringify(body), "0", mac); // Simplified for now

        console.log("[Zalo Webhook Event]:", JSON.stringify(body, null, 2), "Valid Signature:", isValid);

        // Logic to handle events can be added here (oa_send_text, user_send_text, etc.)

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (e) {
        return NextResponse.json({ success: true }, { status: 200 });
    }
}
