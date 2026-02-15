"use server";

import { prisma } from "@/lib/prisma";
import { RoomStatus } from "@prisma/client";

export async function getListings(params?: {
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    amenities?: string[];
}) {
    const page = params?.page || 1;
    const perPage = 20; // Increased for split view

    const where: any = {
        status: RoomStatus.VACANT,
        // Future: Add isPublic: true check
    };

    if (params?.city) {
        where.property = {
            ...where.property,
            or: [
                { address: { contains: params.city, mode: "insensitive" } },
                { city: { contains: params.city, mode: "insensitive" } },
                { name: { contains: params.city, mode: "insensitive" } },
            ],
        };
    }
    if (params?.minPrice) {
        where.baseRent = { ...where.baseRent, gte: params.minPrice };
    }
    if (params?.maxPrice) {
        where.baseRent = { ...where.baseRent, lte: params.maxPrice };
    }

    const [rooms, total] = await Promise.all([
        prisma.room.findMany({
            where,
            include: {
                property: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        city: true,
                        user: { select: { name: true, phone: true, avatar: true } },
                    },
                },
                assets: true, // For amenities
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * perPage,
            take: perPage,
        }),
        prisma.room.count({ where }),
    ]);

    return {
        listings: rooms.map((r) => ({
            id: r.id,
            title: `Phòng ${r.roomNumber} - ${r.property.name}`,
            price: r.baseRent,
            address: r.property.address,
            city: r.property.city,
            area: r.area,
            type: "Phòng trọ", // Could be dynamic
            rating: (4 + Math.random()).toFixed(2), // Mock rating for "World Class" feel
            reviews: Math.floor(Math.random() * 50) + 5, // Mock reviews
            host: {
                name: r.property.user.name,
                avatar: r.property.user.avatar,
                verified: true, // Mock verified status
            },
            images: [
                // Mock images since we don't have real ones yet. Using unsplash/picsum
                `https://picsum.photos/seed/${r.id}1/800/600`,
                `https://picsum.photos/seed/${r.id}2/800/600`,
                `https://picsum.photos/seed/${r.id}3/800/600`,
                `https://picsum.photos/seed/${r.id}4/800/600`,
            ],
            amenities: r.assets.map(a => a.name),
            coordinates: {
                // Mock coordinates around Ho Chi Minh City/Hanoi for map demo
                lat: 10.762622 + (Math.random() - 0.5) * 0.1,
                lng: 106.660172 + (Math.random() - 0.5) * 0.1
            }
        })),
        total,
        totalPages: Math.ceil(total / perPage),
        page,
    };
}
