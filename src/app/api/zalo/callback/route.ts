import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForToken } from "@/lib/zalo";

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!code || !state) {
        return NextResponse.redirect(`${appUrl}/dashboard/settings/zalo?error=missing_params`);
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: state } });
    if (!user) {
        return NextResponse.redirect(`${appUrl}/dashboard/settings/zalo?error=invalid_state`);
    }

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(code);
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
