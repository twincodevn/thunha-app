import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require specific plans
const PROTECTED_ROUTES: Record<string, string[]> = {
    // "/dashboard/analytics": ["PRO", "BUSINESS"],
    "/api/payments/vnpay": ["PRO", "BUSINESS"],
};

// Routes that require authentication
const AUTH_ROUTES = ["/dashboard", "/portal"];

// Public routes (no auth needed)
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/portal/login"];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    let response = NextResponse.next();

    // Clean up zalo_code_verifier cookie on non-Zalo routes
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
        const nonEssentialCookies = ["zalo_code_verifier", "__vercel_live_token"];
        for (const name of nonEssentialCookies) {
            if (request.cookies.has(name)) {
                response.cookies.delete(name);
            }
        }
    }

    // Skip middleware for static files and API auth routes
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api/auth") ||
        pathname.includes(".")
    ) {
        return response;
    }

    // Get JWT token - Auth.js v5 uses "authjs.session-token" cookie name
    const isSecure = request.nextUrl.protocol === "https:";
    const cookieName = isSecure
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";

    const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        cookieName,
        salt: cookieName,
    });

    // Check if route requires authentication
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);

    // Redirect unauthenticated users to login
    if (isAuthRoute && !isPublicRoute && !token) {
        const loginPath = pathname.startsWith("/portal") ? "/portal/login" : "/login";
        const loginUrl = new URL(loginPath, request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from auth pages
    if (token && isPublicRoute && (pathname === "/login" || pathname === "/register" || pathname === "/portal/login")) {
        const role = token?.role as string;
        if (role === "TENANT") {
            return NextResponse.redirect(new URL("/portal/dashboard", request.url));
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (token && pathname === "/portal/login") {
        const role = token?.role as string;
        if (role === "LANDLORD") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.redirect(new URL("/portal/dashboard", request.url));
    }

    // Role-based protection: Prevent Tenant from accessing Landlord Dashboard
    if (token && pathname.startsWith("/dashboard")) {
        const role = token?.role as string;
        if (role === "TENANT") {
            return NextResponse.redirect(new URL("/portal/dashboard", request.url));
        }
    }

    // Role-based protection: Prevent Landlord from accessing Tenant Portal
    if (token && pathname.startsWith("/portal/dashboard")) { // Allow them to access /portal/login though
        const role = token?.role as string;
        if (role === "LANDLORD" || role === "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    // Check plan-based route restrictions
    const userPlan = (token?.plan as string) || "FREE";

    for (const [route, allowedPlans] of Object.entries(PROTECTED_ROUTES)) {
        if (pathname.startsWith(route)) {
            if (!allowedPlans.includes(userPlan)) {
                // Redirect to upgrade page or show error
                const upgradeUrl = new URL("/dashboard/settings", request.url);
                upgradeUrl.searchParams.set("upgrade", "required");
                upgradeUrl.searchParams.set("feature", pathname);
                return NextResponse.redirect(upgradeUrl);
            }
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|public).*)",
    ],
};
