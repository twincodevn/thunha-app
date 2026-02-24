import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getZaloOAuthUrl } from "@/lib/zalo";

/**
 * GET /api/zalo/connect
 * Khởi động OAuth flow: redirect user đến trang xác thực Zalo OA
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${appUrl}/api/zalo/callback`;

    // state = userId để verify sau khi callback
    const state = session.user.id;
    const authUrl = getZaloOAuthUrl(redirectUri, state);

    return NextResponse.redirect(authUrl);
}
