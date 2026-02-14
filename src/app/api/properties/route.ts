import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/validators";

// GET all properties for current user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const properties = await prisma.property.findMany({
            where: { userId: session.user.id },
            include: {
                rooms: {
                    select: {
                        id: true,
                        roomNumber: true,
                        status: true,
                        baseRent: true,
                    },
                },
                _count: {
                    select: { rooms: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(properties);
    } catch (error) {
        console.error("Error fetching properties:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST create new property
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = propertySchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation error", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        // Sanitize input: convert empty strings to null/undefined where appropriate
        const data = validated.data;
        const cleanData = {
            ...data,
            city: data.city || null,
            notes: data.notes || null,
            electricityRate: data.electricityRate ?? 0,
            waterRate: data.waterRate ?? 0,
        };

        const property = await prisma.property.create({
            data: {
                ...cleanData,
                userId: session.user.id,
            },
        });

        return NextResponse.json(property, { status: 201 });
    } catch (error) {
        console.error("Error creating property:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
