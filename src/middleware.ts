import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to prevent 494 REQUEST_HEADER_TOO_LARGE errors on Vercel.
 * 
 * Vercel has a ~16KB header size limit. Large JWT session tokens combined
 * with other cookies (Zalo PKCE verifier, etc.) can exceed this.
 * 
 * This middleware:
 * 1. Cleans up stale/unnecessary cookies
 * 2. Ensures smooth transitions between tenant portal and landlord dashboard
 */
export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const { pathname } = request.nextUrl;

    // Clean up zalo_code_verifier cookie on non-Zalo routes
    // This cookie is only needed during the OAuth flow
    if (!pathname.startsWith("/api/zalo")) {
        const zaloVerifier = request.cookies.get("zalo_code_verifier");
        if (zaloVerifier) {
            response.cookies.delete("zalo_code_verifier");
        }
    }

    // Check total cookie header size — if approaching limit, clear non-essential cookies
    const cookieHeader = request.headers.get("cookie") || "";
    const cookieSize = new TextEncoder().encode(cookieHeader).length;

    // Vercel limit is ~16KB for all headers. Warn at 12KB of cookies alone.
    if (cookieSize > 12000) {
        console.warn(`[Middleware] Cookie header size: ${cookieSize} bytes — approaching Vercel limit`);

        // Delete non-essential cookies to reduce size
        const nonEssentialCookies = ["zalo_code_verifier", "__vercel_live_token"];
        for (const name of nonEssentialCookies) {
            if (request.cookies.has(name)) {
                response.cookies.delete(name);
            }
        }
    }

    return response;
}

export const config = {
    matcher: [
        // Match all routes except static files and API health checks
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
