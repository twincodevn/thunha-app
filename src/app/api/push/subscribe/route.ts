import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/push/subscribe
// Called by OneSignalProvider after user grants permission
// Saves the OneSignal playerId to the Tenant record
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { playerId } = body as { playerId: string };

        if (!playerId || typeof playerId !== "string") {
            return NextResponse.json({ error: "Missing playerId" }, { status: 400 });
        }

        const userId = session.user.id;
        const role = session.user.role;

        if (role === "TENANT") {
            // Update Tenant record
            await prisma.tenant.updateMany({
                where: { id: userId },
                data: { oneSignalPlayerId: playerId },
            });
        } else {
            // For landlords/admins, we skip for now (portal is tenant-only)
            // but keep the endpoint generic
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Push Subscribe] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
