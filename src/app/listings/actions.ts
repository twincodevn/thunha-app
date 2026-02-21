"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type PublicListing = Prisma.RoomGetPayload<{
    include: {
        property: {
            select: {
                name: true;
                address: true;
                city: true;
                lat: true;
                lng: true;
                electricityRate: true;
                waterRate: true;
                user: {
                    select: {
                        name: true;
                        phone: true;
                        avatar: true;
                    }
                }
            }
        };
        assets: true;
    }
}>;

export async function getPublicListingDetail(id: string): Promise<PublicListing | null> {
    try {
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                property: {
                    select: {
                        name: true,
                        address: true,
                        city: true,
                        lat: true,
                        lng: true,
                        electricityRate: true,
                        waterRate: true,
                        user: {
                            select: {
                                name: true,
                                phone: true,
                                avatar: true
                            }
                        }
                    }
                },
                assets: true
            }
        });

        if (!room) return null;
        return room;
    } catch (error) {
        console.error("Failed to fetch public listing", error);
        return null;
    }
}

export async function getListings() {
    try {
        const rooms = await prisma.room.findMany({
            where: { status: "VACANT" },
            include: {
                property: {
                    select: { name: true, address: true, city: true, lat: true, lng: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return {
            total: rooms.length,
            listings: rooms.map(room => ({
                id: room.id,
                title: `${room.property.name} - P.${room.roomNumber}`,
                price: room.baseRent,
                address: room.property.address,
                city: room.property.city || "",
                images: room.images,
                lat: room.property.lat || 0,
                lng: room.property.lng || 0,
                area: room.area || 0,
                type: "Rent"
            }))
        };
    } catch (error) {
        console.error("Failed to fetch listings", error);
        return { total: 0, listings: [] };
    }
}
