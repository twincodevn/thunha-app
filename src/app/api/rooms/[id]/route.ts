import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roomSchema } from "@/lib/validators";

// GET single room
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const room = await prisma.room.findFirst({
            where: {
                id,
                property: { userId: session.user.id },
            },
            include: {
                property: true,
                roomTenants: {
                    include: { tenant: true },
                    orderBy: { startDate: "desc" },
                },
                meterReadings: {
                    orderBy: [{ year: "desc" }, { month: "desc" }],
                    take: 12,
                },
            },
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        return NextResponse.json(room);
    } catch (error) {
        console.error("Error fetching room:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT update room
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validated = roomSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation error", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        // Check ownership
        const existing = await prisma.room.findFirst({
            where: { id, property: { userId: session.user.id } },
        });

        if (!existing) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        const room = await prisma.room.update({
            where: { id },
            data: validated.data,
            include: { property: true },
        });

        return NextResponse.json(room);
    } catch (error) {
        console.error("Error updating room:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE room
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Check ownership
        const existing = await prisma.room.findFirst({
            where: { id, property: { userId: session.user.id } },
        });

        if (!existing) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        await prisma.room.delete({ where: { id } });

        return NextResponse.json({ message: "Room deleted" });
    } catch (error) {
        console.error("Error deleting room:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
