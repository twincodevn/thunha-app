
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isTenant = session.user.role === "TENANT";
        const whereClause = isTenant
            ? { tenantId: session.user.id }
            : { userId: session.user.id };

        const notifications = await prisma.notification.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        // Count unread
        const unreadCount = await prisma.notification.count({
            where: { ...whereClause, isRead: false },
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Mark as read
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Mark all as read for now (simple implementation)
        // Or specific ID if provided in body
        const body = await request.json();
        const { id } = body;

        const isTenant = session.user.role === "TENANT";
        const whereFields = isTenant ? { tenantId: session.user.id } : { userId: session.user.id };

        if (id) {
            await prisma.notification.update({
                where: { id },
                data: { isRead: true },
            });
        } else {
            await prisma.notification.updateMany({
                where: { ...whereFields, isRead: false },
                data: { isRead: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
