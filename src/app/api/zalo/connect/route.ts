import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getZaloOAuthUrl, generateCodeVerifier, generateCodeChallenge } from "@/lib/zalo";
import { cookies } from "next/headers";

/**
 * GET /api/zalo/connect
 * Khởi động OAuth flow: redirect user đến trang xác thực Zalo OA
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin = req.nextUrl.origin;
    const redirectUri = `${origin}/api/zalo/callback`;

    // PKCE
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // Lưu verifier vào cookie để dùng lại ở callback
    const cookieStore = await cookies();
    cookieStore.set("zalo_code_verifier", codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 10, // 10 phút
        path: "/",
    });

    // state = userId để verify sau khi callback
    const state = session.user.id;
    const authUrl = getZaloOAuthUrl(redirectUri, state, codeChallenge);

    return NextResponse.redirect(authUrl);
}
