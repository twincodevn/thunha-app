import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/validators";

// GET single property
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const property = await prisma.property.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
            include: {
                rooms: {
                    include: {
                        roomTenants: {
                            where: { isActive: true },
                            include: { tenant: true },
                        },
                    },
                    orderBy: { roomNumber: "asc" },
                },
            },
        });

        if (!property) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        return NextResponse.json(property);
    } catch (error) {
        console.error("Error fetching property:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT update property
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validated = propertySchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation error", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        // Check ownership
        const existing = await prisma.property.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        const property = await prisma.property.update({
            where: { id },
            data: validated.data,
        });

        return NextResponse.json(property);
    } catch (error) {
        console.error("Error updating property:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE property
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Check ownership
        const existing = await prisma.property.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Property not found" }, { status: 404 });
        }

        await prisma.property.delete({ where: { id } });

        return NextResponse.json({ message: "Property deleted" });
    } catch (error) {
        console.error("Error deleting property:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
