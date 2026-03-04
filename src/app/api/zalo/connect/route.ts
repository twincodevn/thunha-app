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
        return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }

    // Đảm bảo dùng domain chính thức thunha.vercel.app để tránh mismatch
    const redirectUri = "https://thunha.vercel.app/api/zalo/callback";

    // PKCE
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // Lưu verifier vào cookie
    const cookieStore = await cookies();

    // Xóa cookie cũ nếu có để tránh Header too large
    cookieStore.delete("zalo_code_verifier");

    cookieStore.set("zalo_code_verifier", codeVerifier, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 600,
        path: "/",
    });

    const authUrl = getZaloOAuthUrl(redirectUri, session.user.id, codeChallenge);

    // Log URL để debug
    console.log("[Zalo Connect URL]:", authUrl);

    return NextResponse.redirect(authUrl);
}
