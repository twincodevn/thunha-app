"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updatePropertyAction(formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const city = formData.get("city") as string;
    const electricityRate = parseFloat(formData.get("electricityRate") as string) || 0;
    const waterRate = parseFloat(formData.get("waterRate") as string) || 0;
    const lateFee = parseFloat(formData.get("lateFee") as string) || 0;
    const lateFeeType = (formData.get("lateFeeType") as string) || "FIXED";
    const lat = formData.get("lat") ? parseFloat(formData.get("lat") as string) : null;
    const lng = formData.get("lng") ? parseFloat(formData.get("lng") as string) : null;
    const notes = formData.get("notes") as string;

    try {
        await prisma.property.update({
            where: { id, userId: session.user.id },
            data: { name, address, city, electricityRate, waterRate, lateFee, lateFeeType, lat, lng, notes },
        });

        revalidatePath(`/dashboard/properties/${id}`);
    } catch (error) {
        console.error("Error updating property:", error);
        return { error: "Failed to update property" };
    }

    redirect(`/dashboard/properties/${id}`);
}

export async function getMeterReadings(propertyId: string, month: number, year: number) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        const rooms = await prisma.room.findMany({
            where: { propertyId },
            include: {
                roomTenants: {
                    where: { isActive: true },
                    take: 1,
                    include: {
                        tenant: true
                    }
                },
                meterReadings: {
                    where: { month, year },
                    take: 1
                }
            },
            orderBy: { roomNumber: 'asc' }
        });

        return { rooms };
    } catch (error) {
        console.error("Failed to fetch meter readings", error);
        return { error: "Failed to fetch meter readings" };
    }
}

export async function upsertMeterReadings(data: {
    propertyId: string;
    month: number;
    year: number;
    readings: Array<{
        roomId: string;
        electricityNew: number;
        waterNew: number;
    }>
}) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        for (const reading of data.readings) {
            // Calculate usage if possible? Or just save current index
            // For now, we just save the current index.
            // In a real app, we might fetch previous month to calculate usage.
            // But here let's just update the record.

            await prisma.meterReading.upsert({
                where: {
                    roomId_month_year: {
                        roomId: reading.roomId,
                        month: data.month,
                        year: data.year
                    }
                },
                create: {
                    roomId: reading.roomId,
                    month: data.month,
                    year: data.year,
                    electricityCurrent: reading.electricityNew,
                    waterCurrent: reading.waterNew,
                    electricityUsage: 0, // Todo: calculate
                    waterUsage: 0 // Todo: calculate
                },
                update: {
                    electricityCurrent: reading.electricityNew,
                    waterCurrent: reading.waterNew,
                }
            });
        }
        revalidatePath(`/dashboard/properties/${data.propertyId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to upsert readings", error);
        return { error: "Failed to save readings" };
    }
}


export async function updatePropertyServices(propertyId: string, services: any[]) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    try {
        await prisma.property.update({
            where: { id: propertyId, userId: session.user.id },
            data: { services: services },
        });

        revalidatePath(`/dashboard/properties/${propertyId}`);
        return { success: true };
    } catch (error) {
        console.error("Error updating services:", error);
        return { error: "Failed to update services" };
    }
}
