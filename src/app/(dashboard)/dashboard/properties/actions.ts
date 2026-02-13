"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMeterReadings(
    propertyId: string,
    month: number,
    year: number
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Get all rooms for the property to ensure we return a reading (even if empty) for each
    const rooms = await prisma.room.findMany({
        where: { propertyId, property: { userId: session.user.id } },
        select: { id: true },
    });

    // 1. Try to find existing readings for THIS month
    const currentReadings = await prisma.meterReading.findMany({
        where: {
            roomId: { in: rooms.map(r => r.id) },
            month,
            year,
        },
    });

    // 2. Try to find readings for the PREVIOUS month to use as "Prev" values
    // Logic: If current month is 1, prev is 12 of year-1
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const previousReadings = await prisma.meterReading.findMany({
        where: {
            roomId: { in: rooms.map(r => r.id) },
            month: prevMonth,
            year: prevYear,
        },
    });

    // Merge logic
    return rooms.map(room => {
        const current = currentReadings.find(r => r.roomId === room.id);
        const previous = previousReadings.find(r => r.roomId === room.id);

        return {
            roomId: room.id,
            // If current exists, use its values
            // If not, use previous.current as new prev, and 0/same as new current
            electricityPrev: current?.electricityPrev ?? previous?.electricityCurrent ?? 0,
            electricityCurrent: current?.electricityCurrent ?? 0,
            waterPrev: current?.waterPrev ?? previous?.waterCurrent ?? 0,
            waterCurrent: current?.waterCurrent ?? 0,
        };
    });
}

export async function updatePropertyServices(
    propertyId: string,
    services: { name: string; price: number }[]
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.property.update({
        where: {
            id: propertyId,
            userId: session.user.id,
        },
        data: {
            services: services as any,
        },
    });

    revalidatePath(`/dashboard/properties/${propertyId}`);
    return { success: true };
}

export async function upsertMeterReadings(
    propertyId: string,
    month: number,
    year: number,
    readings: {
        roomId: string;
        electricityPrev: number;
        electricityCurrent: number;
        waterPrev: number;
        waterCurrent: number;
    }[]
) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Verify property ownership
    const property = await prisma.property.findFirst({
        where: { id: propertyId, userId: session.user.id },
    });
    if (!property) throw new Error("Property not found or unauthorized");

    await prisma.$transaction(
        readings.map((reading) =>
            prisma.meterReading.upsert({
                where: {
                    roomId_month_year: {
                        roomId: reading.roomId,
                        month,
                        year,
                    },
                },
                update: {
                    electricityPrev: reading.electricityPrev,
                    electricityCurrent: reading.electricityCurrent,
                    electricityUsage: reading.electricityCurrent - reading.electricityPrev,
                    waterPrev: reading.waterPrev,
                    waterCurrent: reading.waterCurrent,
                    waterUsage: reading.waterCurrent - reading.waterPrev,
                },
                create: {
                    roomId: reading.roomId,
                    month,
                    year,
                    electricityPrev: reading.electricityPrev,
                    electricityCurrent: reading.electricityCurrent,
                    electricityUsage: reading.electricityCurrent - reading.electricityPrev,
                    waterPrev: reading.waterPrev,
                    waterCurrent: reading.waterCurrent,
                    waterUsage: reading.waterCurrent - reading.waterPrev,
                },
            })
        )
    );

    revalidatePath(`/dashboard/properties/${propertyId}`);
}
