import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/zalo/status
 * Returns whether the current user has a connected Zalo OA
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ connected: false });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            zaloOaAccessToken: true,
            zaloOaTokenExpiry: true,
            zaloOaId: true,
        },
    });

    const isConnected = !!(
        user?.zaloOaAccessToken &&
        user?.zaloOaTokenExpiry &&
        user.zaloOaTokenExpiry > new Date()
    );

    return NextResponse.json({
        connected: isConnected,
        oaId: user?.zaloOaId || null,
        tokenExpiry: user?.zaloOaTokenExpiry || null,
    });
}
