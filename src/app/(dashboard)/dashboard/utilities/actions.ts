
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const recordReadingsSchema = z.object({
    propertyId: z.string(),
    month: z.number().min(1).max(12),
    year: z.number().min(2024),
    readings: z.array(
        z.object({
            roomId: z.string(),
            electricityCurrent: z.number().min(0),
            waterCurrent: z.number().min(0),
        })
    ),
});

export async function getUtilityReadings(propertyId: string, month: number, year: number) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    // Verify property ownership
    const property = await prisma.property.findFirst({
        where: {
            id: propertyId,
            userId: session.user.id,
        },
    });

    if (!property) {
        throw new Error("Property not found");
    }

    // Get all OCCUPIED rooms for this property
    const rooms = await prisma.room.findMany({
        where: {
            propertyId: propertyId,
            status: "OCCUPIED",
        },
        select: {
            id: true,
            roomNumber: true,
            meterReadings: {
                where: {
                    OR: [
                        { month: month, year: year }, // Current reading
                        { month: month === 1 ? 12 : month - 1, year: month === 1 ? year - 1 : year }, // Previous reading
                    ],
                },
            },
        },
        orderBy: {
            roomNumber: "asc",
        },
    });

    // Transform data for UI
    const roomReadings = rooms.map((room) => {
        const currentReading = room.meterReadings.find((r) => r.month === month && r.year === year);

        const previousMonth = month === 1 ? 12 : month - 1;
        const previousYear = month === 1 ? year - 1 : year;
        const prevReadingRecord = room.meterReadings.find((r) => r.month === previousMonth && r.year === previousYear);

        return {
            roomId: room.id,
            roomNumber: room.roomNumber,

            // Previous indices (from last month's current, or 0)
            electricityOld: prevReadingRecord?.electricityCurrent ?? 0,
            waterOld: prevReadingRecord?.waterCurrent ?? 0,

            // Current indices (if already saved)
            electricityNew: currentReading?.electricityCurrent ?? undefined,
            electricityUsage: currentReading?.electricityUsage ?? undefined,
            waterNew: currentReading?.waterCurrent ?? undefined,
            waterUsage: currentReading?.waterUsage ?? undefined,
        };
    });

    return {
        roomReadings,
        electricityRate: property.electricityRate || 0,
        waterRate: property.waterRate || 0,
    };
}

export async function saveUtilityReadings(data: z.infer<typeof recordReadingsSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const result = recordReadingsSchema.safeParse(data);
    if (!result.success) {
        return { error: "Invalid data" };
    }

    const { propertyId, month, year, readings } = result.data;

    try {
        await prisma.$transaction(async (tx) => {
            for (const reading of readings) {
                const previousMonth = month === 1 ? 12 : month - 1;
                const previousYear = month === 1 ? year - 1 : year;

                const prevReading = await tx.meterReading.findUnique({
                    where: {
                        roomId_month_year: {
                            roomId: reading.roomId,
                            month: previousMonth,
                            year: previousYear,
                        },
                    },
                });

                const electricityPrev = prevReading?.electricityCurrent ?? 0;
                const waterPrev = prevReading?.waterCurrent ?? 0;

                const electricityUsage = reading.electricityCurrent - electricityPrev;
                const waterUsage = reading.waterCurrent - waterPrev;

                if (electricityUsage < 0 || waterUsage < 0) {
                    const room = await tx.room.findUnique({ where: { id: reading.roomId } });
                    throw new Error(`Chỉ số mới thấp hơn chỉ số cũ tại phòng ${room?.roomNumber || 'Unknown'} (Điện: ${electricityPrev}, Nước: ${waterPrev})`);
                }

                await tx.meterReading.upsert({
                    where: {
                        roomId_month_year: {
                            roomId: reading.roomId,
                            month,
                            year,
                        },
                    },
                    update: {
                        electricityPrev,
                        electricityCurrent: reading.electricityCurrent,
                        electricityUsage,
                        waterPrev,
                        waterCurrent: reading.waterCurrent,
                        waterUsage,
                    },
                    create: {
                        roomId: reading.roomId,
                        month,
                        year,
                        electricityPrev,
                        electricityCurrent: reading.electricityCurrent,
                        electricityUsage,
                        waterPrev,
                        waterCurrent: reading.waterCurrent,
                        waterUsage,
                    },
                });
            }
        });

        revalidatePath("/dashboard/utilities");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to save readings:", error);
        return { error: error.message || "Failed to save readings" };
    }
}
