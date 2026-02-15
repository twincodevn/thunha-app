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
    const perPage = 20;

    const where: any = {
        status: RoomStatus.VACANT,
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
                assets: true,
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * perPage,
            take: perPage,
        }),
        prisma.room.count({ where }),
    ]);

    // Format real data
    return {
        listings: rooms.map((r) => ({
            id: r.id,
            title: `Phòng ${r.roomNumber} - ${r.property.name} ${r.floor ? `(T${r.floor})` : ''}`,
            price: r.baseRent,
            address: r.property.address || "Đang cập nhật",
            city: r.property.city || "Việt Nam",
            area: r.area,
            type: "Phòng trọ",
            rating: (4 + Math.random()).toFixed(2), // Still mock rating/reviews as DB doesn't have it yet
            reviews: Math.floor(Math.random() * 50) + 5,
            host: {
                name: r.property.user?.name || "Chủ nhà",
                avatar: r.property.user?.avatar,
                verified: true,
            },
            // Fallback images since DB has no room images table yet.
            // In future, link to r.images or r.assets images
            images: [
                `https://picsum.photos/seed/${r.id}/800/600`, // Main cover
                `https://picsum.photos/seed/${r.property.id}/800/600`, // Property cover
                `https://picsum.photos/seed/room${r.roomNumber}/800/600`,
                `https://picsum.photos/seed/view${r.id}/800/600`,
            ],
            amenities: r.assets.map(a => a.name),
            coordinates: {
                // Random scatter near HCMC center (10.762, 106.660) to show on map
                // In future, geocode r.property.address
                lat: 10.762 + (Math.random() - 0.5) * 0.05,
                lng: 106.660 + (Math.random() - 0.5) * 0.05
            }
        })),
        total,
        totalPages: Math.ceil(total / perPage),
        page,
    };
}
