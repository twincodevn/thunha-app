import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateElectricityCost, calculateWaterCost, calculateBillTotal } from "@/lib/billing";

// Valid bill status values for type-safe filtering
type BillStatusType = "DRAFT" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
const validBillStatuses: BillStatusType[] = ["DRAFT", "PENDING", "PAID", "OVERDUE", "CANCELLED"];

// GET all bills
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const statusParam = searchParams.get("status");
        const month = searchParams.get("month");
        const year = searchParams.get("year");

        // FIX: Validate status against enum instead of using 'as any'
        const validatedStatus = statusParam && validBillStatuses.includes(statusParam as BillStatusType)
            ? (statusParam as BillStatusType)
            : undefined;

        const where = {
            roomTenant: { room: { property: { userId: session.user.id } } },
            ...(validatedStatus && { status: validatedStatus }),
            ...(month && { month: parseInt(month) }),
            ...(year && { year: parseInt(year) }),
        };

        const bills = await prisma.bill.findMany({
            where,
            include: {
                roomTenant: {
                    include: {
                        room: { include: { property: true } },
                        tenant: true,
                    },
                },
                invoice: true,
                payments: true,
            },
            orderBy: [{ year: "desc" }, { month: "desc" }, { createdAt: "desc" }],
        });

        return NextResponse.json(bills);
    } catch (error) {
        console.error("Error fetching bills:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST generate bills for a month
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { month, year, propertyId, dueDate } = body;

        if (!month || !year || !dueDate) {
            return NextResponse.json(
                { error: "Month, year and due date are required" },
                { status: 400 }
            );
        }

        // Get all occupied rooms for this user (optionally filtered by property)
        const roomTenants = await prisma.roomTenant.findMany({
            where: {
                isActive: true,
                room: {
                    property: {
                        userId: session.user.id,
                        ...(propertyId && { id: propertyId }),
                    },
                },
            },
            include: {
                room: { include: { property: true } },
                tenant: true,
            },
        });

        if (roomTenants.length === 0) {
            return NextResponse.json(
                { error: "Không có phòng nào đang cho thuê" },
                { status: 400 }
            );
        }

        const bills = [];

        for (const roomTenant of roomTenants) {
            // Check if bill already exists for this month
            const existingBill = await prisma.bill.findFirst({
                where: { roomTenantId: roomTenant.id, month, year },
            });

            if (existingBill) {
                continue; // Skip if bill exists
            }

            // Get meter reading for this room/month
            const meterReading = await prisma.meterReading.findUnique({
                where: {
                    roomId_month_year: {
                        roomId: roomTenant.roomId,
                        month,
                        year,
                    },
                },
            });

            const electricityUsage = meterReading?.electricityUsage || 0;
            const waterUsage = meterReading?.waterUsage || 0;

            // Calculate costs
            const electricityRate = roomTenant.room.property.electricityRate;
            const waterRate = roomTenant.room.property.waterRate || 25000;

            const electricityAmount = calculateElectricityCost(electricityUsage, electricityRate || undefined);
            const waterAmount = calculateWaterCost(waterUsage, waterRate);

            const total = calculateBillTotal({
                baseRent: roomTenant.room.baseRent,
                electricityAmount,
                waterAmount,
            });

            // Create bill
            const bill = await prisma.bill.create({
                data: {
                    roomTenantId: roomTenant.id,
                    meterReadingId: meterReading?.id,
                    month,
                    year,
                    baseRent: roomTenant.room.baseRent,
                    electricityUsage,
                    electricityAmount,
                    waterUsage,
                    waterAmount,
                    total,
                    dueDate: new Date(dueDate),
                    status: "PENDING",
                },
                include: {
                    roomTenant: {
                        include: {
                            room: { include: { property: true } },
                            tenant: true,
                        },
                    },
                },
            });

            bills.push(bill);
        }

        return NextResponse.json({
            message: `Đã tạo ${bills.length} hóa đơn`,
            bills,
        });
    } catch (error) {
        console.error("Error generating bills:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
