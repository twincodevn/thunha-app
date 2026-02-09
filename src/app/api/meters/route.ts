import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { meterReadingSchema } from "@/lib/validators";

// GET meter readings
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const roomId = searchParams.get("roomId");
        const month = searchParams.get("month");
        const year = searchParams.get("year");

        const where = {
            room: { property: { userId: session.user.id } },
            ...(roomId && { roomId }),
            ...(month && { month: parseInt(month) }),
            ...(year && { year: parseInt(year) }),
        };

        const readings = await prisma.meterReading.findMany({
            where,
            include: {
                room: { include: { property: true } },
            },
            orderBy: [{ year: "desc" }, { month: "desc" }],
        });

        return NextResponse.json(readings);
    } catch (error) {
        console.error("Error fetching meter readings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST create/update meter reading
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = meterReadingSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation error", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const { roomId, month, year, electricityCurrent, waterCurrent } = validated.data;

        // Verify room ownership
        const room = await prisma.room.findFirst({
            where: { id: roomId, property: { userId: session.user.id } },
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        // Get previous reading for this room
        const previousReading = await prisma.meterReading.findFirst({
            where: {
                roomId,
                OR: [
                    { year: { lt: year } },
                    { year, month: { lt: month } },
                ],
            },
            orderBy: [{ year: "desc" }, { month: "desc" }],
        });

        const electricityPrev = previousReading?.electricityCurrent || 0;
        const waterPrev = previousReading?.waterCurrent || 0;

        const electricityUsage = Math.max(0, electricityCurrent - electricityPrev);
        const waterUsage = Math.max(0, waterCurrent - waterPrev);

        // Upsert the reading
        const reading = await prisma.meterReading.upsert({
            where: {
                roomId_month_year: { roomId, month, year },
            },
            update: {
                electricityCurrent,
                electricityPrev,
                electricityUsage,
                waterCurrent,
                waterPrev,
                waterUsage,
            },
            create: {
                roomId,
                month,
                year,
                electricityPrev,
                electricityCurrent,
                electricityUsage,
                waterPrev,
                waterCurrent,
                waterUsage,
            },
            include: {
                room: { include: { property: true } },
            },
        });

        return NextResponse.json(reading);
    } catch (error) {
        console.error("Error saving meter reading:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
