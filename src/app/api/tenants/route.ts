import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenantSchema } from "@/lib/validators";

// GET all tenants
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const tenants = await prisma.tenant.findMany({
            where: { userId: session.user.id },
            include: {
                roomTenants: {
                    where: { isActive: true },
                    include: {
                        room: {
                            include: { property: true },
                        },
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(tenants);
    } catch (error) {
        console.error("Error fetching tenants:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST create new tenant
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = tenantSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation error", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const tenant = await prisma.tenant.create({
            data: {
                ...validated.data,
                email: validated.data.email || null,
                dateOfBirth: validated.data.dateOfBirth
                    ? new Date(validated.data.dateOfBirth)
                    : null,
                userId: session.user.id,
            },
        });

        return NextResponse.json(tenant, { status: 201 });
    } catch (error) {
        console.error("Error creating tenant:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
