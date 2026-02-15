import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Public REST API v1
 * Authenticated via API key or session
 * 
 * GET /api/v1/properties - List properties
 * GET /api/v1/properties?include=rooms,bills - With relations
 */

async function authenticateRequest(request: NextRequest) {
    // Try API key first
    const apiKey = request.headers.get("x-api-key");
    if (apiKey) {
        // Find user by API key (stored in resetToken field for simplicity)
        const user = await prisma.user.findFirst({
            where: { resetToken: apiKey },
        });
        if (user) return user.id;
    }

    // Fall back to session
    const session = await auth();
    if (session?.user?.id) return session.user.id;

    return null;
}

export async function GET(request: NextRequest) {
    const userId = await authenticateRequest(request);
    if (!userId) {
        return NextResponse.json(
            { error: "Unauthorized. Provide x-api-key header or login." },
            { status: 401 }
        );
    }

    const include = request.nextUrl.searchParams.get("include")?.split(",") || [];

    try {
        const properties = await prisma.property.findMany({
            where: { userId },
            include: {
                rooms: include.includes("rooms")
                    ? {
                        include: {
                            roomTenants: include.includes("tenants")
                                ? {
                                    where: { isActive: true },
                                    include: {
                                        tenant: { select: { name: true, phone: true, email: true } },
                                        bills: include.includes("bills")
                                            ? { orderBy: { createdAt: "desc" }, take: 3 }
                                            : false,
                                    },
                                }
                                : false,
                        },
                    }
                    : false,
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json({
            data: properties,
            meta: {
                total: properties.length,
                timestamp: new Date().toISOString(),
                version: "v1",
            },
        });
    } catch (error) {
        console.error("[API v1] Error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
