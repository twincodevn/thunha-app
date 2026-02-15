"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Marketplace - List vacant rooms publicly
 */
export async function getPublicListings(params?: {
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
}) {
    const page = params?.page || 1;
    const perPage = 12;

    const where: any = {
        status: "AVAILABLE",
        property: {
            // Only show rooms from users who opted in to marketplace
            // For now, show all available rooms
        },
    };

    if (params?.city) {
        where.property = {
            ...where.property,
            address: { contains: params.city, mode: "insensitive" },
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
                        name: true,
                        address: true,
                        user: { select: { name: true, phone: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * perPage,
            take: perPage,
        }),
        prisma.room.count({ where }),
    ]);

    return {
        rooms: rooms.map((r) => ({
            id: r.id,
            roomNumber: r.roomNumber,
            baseRent: r.baseRent,
            area: r.area,
            floor: r.floor,
            description: r.description,
            amenities: r.amenities,
            deposit: r.deposit,
            propertyName: r.property.name,
            address: r.property.address,
            landlordName: r.property.user.name,
            landlordPhone: r.property.user.phone,
        })),
        total,
        totalPages: Math.ceil(total / perPage),
        page,
    };
}

/**
 * Toggle room listing on marketplace (landlord action)
 */
export async function toggleMarketplaceListing(roomId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { property: true },
    });

    if (!room || room.property.userId !== session.user.id) {
        return { error: "Unauthorized" };
    }

    if (room.status !== "AVAILABLE") {
        return { error: "Chỉ có thể đăng phòng trống" };
    }

    // Toggle (for now just return success, listing is based on AVAILABLE status)
    revalidatePath("/marketplace");
    return { success: true, listed: true };
}
