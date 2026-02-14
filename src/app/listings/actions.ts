"use server";

import { prisma } from "@/lib/prisma";
import { RoomStatus } from "@prisma/client";

export async function getPublicListings(
    search?: string,
    minPrice?: number,
    maxPrice?: number,
    city?: string
) {
    const where: any = {
        status: RoomStatus.VACANT,
        property: {
            // Ensure we only show properties from active users if needed, 
            // but for now, just all vacant rooms
        }
    };

    if (search) {
        where.OR = [
            { roomNumber: { contains: search, mode: "insensitive" } },
            { property: { name: { contains: search, mode: "insensitive" } } },
            { property: { address: { contains: search, mode: "insensitive" } } },
        ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        where.baseRent = {};
        if (minPrice !== undefined) where.baseRent.gte = minPrice;
        if (maxPrice !== undefined) where.baseRent.lte = maxPrice;
    }

    if (city && city !== "ALL") {
        where.property = {
            ...where.property,
            city: { contains: city, mode: "insensitive" }
        };
    }

    try {
        const rooms = await prisma.room.findMany({
            where,
            include: {
                property: {
                    select: {
                        name: true,
                        address: true,
                        city: true,
                        electricityRate: true,
                        waterRate: true,
                        user: {
                            select: {
                                name: true,
                                phone: true,
                                avatar: true,
                            }
                        }
                    },
                },
                // We might want to include images if we had a dedicated RoomImage model,
                // but currently images are on Asset or Incident. 
                // We'll use a placeholder or derived image for now.
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50, // Limit to 50 for now
        });

        return rooms;
    } catch (error) {
        console.error("Error fetching public listings:", error);
        return [];
    }
}

export async function getPublicListingDetail(id: string) {
    try {
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                property: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                phone: true,
                                avatar: true,
                                email: true // Optional: for contact form
                            }
                        }
                    }
                },
                assets: true // Show amenities
            }
        });

        if (!room || room.status !== RoomStatus.VACANT) {
            return null;
        }

        return room;
    } catch (error) {
        console.error("Error fetching listing detail:", error);
        return null;
    }
}

export async function getCities() {
    // Get unique cities from properties
    const locations = await prisma.property.findMany({
        select: { city: true },
        where: { rooms: { some: { status: RoomStatus.VACANT } } },
        distinct: ['city']
    });
    return locations.map(l => l.city).filter(Boolean) as string[];
}
