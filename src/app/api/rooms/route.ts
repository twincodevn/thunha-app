import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roomSchema } from "@/lib/validators";
import { PLAN_LIMITS } from "@/lib/constants";
import { UserPlan } from "@prisma/client";

// GET all rooms (optionally by property)
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get("propertyId");

        const where = {
            property: { userId: session.user.id },
            ...(propertyId && { propertyId }),
        };

        const rooms = await prisma.room.findMany({
            where,
            include: {
                property: true,
                roomTenants: {
                    where: { isActive: true },
                    include: { tenant: true },
                },
            },
            orderBy: [{ property: { name: "asc" } }, { roomNumber: "asc" }],
        });

        return NextResponse.json(rooms);
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST create new room
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { propertyId, ...roomData } = body;

        if (!propertyId) {
            return NextResponse.json({ error: "Property ID is required" }, { status: 400 });
        }

        const validated = roomSchema.safeParse(roomData);
        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation error", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        // Check property ownership
        const property = await prisma.property.findFirst({
            where: { id: propertyId, userId: session.user.id },
        });

        if (!property) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        // Check room limit
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        const currentRoomCount = await prisma.room.count({
            where: { property: { userId: session.user.id } },
        });

        const maxRooms = PLAN_LIMITS[user?.plan as UserPlan] || 3;
        if (currentRoomCount >= maxRooms) {
            return NextResponse.json(
                { error: `Bạn đã đạt giới hạn ${maxRooms} phòng. Vui lòng nâng cấp gói.` },
                { status: 403 }
            );
        }

        // Check unique room number within property
        const existingRoom = await prisma.room.findFirst({
            where: { propertyId, roomNumber: validated.data.roomNumber },
        });

        if (existingRoom) {
            return NextResponse.json(
                { error: "Số phòng đã tồn tại trong tòa nhà này" },
                { status: 400 }
            );
        }

        const room = await prisma.room.create({
            data: {
                ...validated.data,
                propertyId,
            },
            include: { property: true },
        });

        return NextResponse.json(room, { status: 201 });
    } catch (error) {
        console.error("Error creating room:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
