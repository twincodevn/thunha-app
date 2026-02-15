import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Bills API v1
 * GET /api/v1/bills?month=1&year=2026&status=PENDING
 */

export async function GET(request: NextRequest) {
    // Auth
    const apiKey = request.headers.get("x-api-key");
    let userId: string | null = null;

    if (apiKey) {
        const user = await prisma.user.findFirst({ where: { resetToken: apiKey } });
        if (user) userId = user.id;
    } else {
        const session = await auth();
        userId = session?.user?.id || null;
    }

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    try {
        const where: any = {
            roomTenant: { room: { property: { userId } } },
        };
        if (month) where.month = month;
        if (year) where.year = year;
        if (status) where.status = status;

        const [bills, total] = await Promise.all([
            prisma.bill.findMany({
                where,
                include: {
                    roomTenant: {
                        include: {
                            tenant: { select: { name: true, phone: true } },
                            room: {
                                select: {
                                    roomNumber: true,
                                    property: { select: { name: true } },
                                },
                            },
                        },
                    },
                    payments: { select: { amount: true, method: true, paidAt: true } },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.bill.count({ where }),
        ]);

        return NextResponse.json({
            data: bills.map((b) => ({
                id: b.id,
                month: b.month,
                year: b.year,
                status: b.status,
                baseRent: b.baseRent,
                electricityAmount: b.electricityAmount,
                electricityUsage: b.electricityUsage,
                waterAmount: b.waterAmount,
                waterUsage: b.waterUsage,
                total: b.total,
                dueDate: b.dueDate.toISOString(),
                tenant: b.roomTenant.tenant.name,
                tenantPhone: b.roomTenant.tenant.phone,
                room: b.roomTenant.room.roomNumber,
                property: b.roomTenant.room.property.name,
                payments: b.payments,
                totalPaid: b.payments.reduce((s, p) => s + p.amount, 0),
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                version: "v1",
            },
        });
    } catch (error) {
        console.error("[API v1 Bills] Error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
