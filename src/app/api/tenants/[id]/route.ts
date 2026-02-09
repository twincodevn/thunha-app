import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantSchema } from "@/lib/validators";

// GET single tenant
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

        const tenant = await prisma.tenant.findFirst({
            where: { id, userId: session.user.id },
            include: {
                roomTenants: {
                    include: {
                        room: { include: { property: true } },
                        bills: {
                            orderBy: [{ year: "desc" }, { month: "desc" }],
                            take: 12,
                        },
                    },
                    orderBy: { startDate: "desc" },
                },
            },
        });

        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        return NextResponse.json(tenant);
    } catch (error) {
        console.error("Error fetching tenant:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT update tenant
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
        const validated = tenantSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation error", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const existing = await prisma.tenant.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        const tenant = await prisma.tenant.update({
            where: { id },
            data: {
                ...validated.data,
                email: validated.data.email || null,
                dateOfBirth: validated.data.dateOfBirth
                    ? new Date(validated.data.dateOfBirth)
                    : null,
            },
        });

        return NextResponse.json(tenant);
    } catch (error) {
        console.error("Error updating tenant:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE tenant
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

        const existing = await prisma.tenant.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        await prisma.tenant.delete({ where: { id } });

        return NextResponse.json({ message: "Tenant deleted" });
    } catch (error) {
        console.error("Error deleting tenant:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
