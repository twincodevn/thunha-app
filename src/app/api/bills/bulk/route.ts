import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface BulkBillRequest {
    month: number;
    year: number;
    dueDate: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: BulkBillRequest = await request.json();
        const { month, year, dueDate } = body;

        // Validate input
        if (!month || !year || !dueDate) {
            return NextResponse.json(
                { error: "Vui lòng nhập đầy đủ thông tin" },
                { status: 400 }
            );
        }

        // Get all rooms with active tenants for this user
        const roomTenants = await prisma.roomTenant.findMany({
            where: {
                room: { property: { userId: session.user.id } },
                isActive: true,
            },
            include: {
                room: {
                    include: {
                        property: true,
                    },
                },
                tenant: true,
            },
        });

        if (roomTenants.length === 0) {
            return NextResponse.json(
                { error: "Không có phòng đang thuê để tạo hóa đơn" },
                { status: 400 }
            );
        }

        // Check which rooms already have bills for this month
        const existingBills = await prisma.bill.findMany({
            where: {
                month,
                year,
                roomTenantId: { in: roomTenants.map((rt: { id: string }) => rt.id) },
            },
            select: { roomTenantId: true },
        });

        const existingRoomTenantIds = new Set(existingBills.map((b: { roomTenantId: string }) => b.roomTenantId));
        const roomTenantsToCreate = roomTenants.filter(
            (rt: { id: string }) => !existingRoomTenantIds.has(rt.id)
        );

        if (roomTenantsToCreate.length === 0) {
            return NextResponse.json(
                { error: "Tất cả các phòng đã có hóa đơn tháng này" },
                { status: 400 }
            );
        }

        // Get previous meter readings for each room
        const createdBills: Array<{
            id: string;
            roomNumber: string;
            propertyName: string;
            tenantName: string;
        }> = [];
        const skippedRooms: Array<{
            roomNumber: string;
            propertyName: string;
            reason: string;
        }> = [];

        for (const roomTenant of roomTenantsToCreate) {
            // 1. Check if a meter reading already exists for this month/year for this room
            let currentMeterReading = await prisma.meterReading.findFirst({
                where: {
                    roomId: roomTenant.room.id,
                    month,
                    year,
                }
            });

            // 2. If not, create one based on previous readings
            if (!currentMeterReading) {
                // Get the most recent meter reading for this room (from previous months)
                const lastMeterReading = await prisma.meterReading.findFirst({
                    where: {
                        roomId: roomTenant.room.id,
                        // Ensure it's active or related to past bills of this room
                        // Just sorting by createdAt desc is a good approximation for "last reading entered"
                    },
                    orderBy: { createdAt: "desc" },
                });

                // If absolutely no previous reading exists ever for this room, we default to 0
                // or we could skip if we want to be strict.
                // But for bulk billing, defaulting to 0 allows the user to edit later.
                // However, the prompt requirements earlier said "Skip rooms that already have bills".
                // And my code previously skipped if no lastReading.
                // Let's stick to: If no previous reading, skip (safer, forces manual first bill).
                if (!lastMeterReading) {
                    skippedRooms.push({
                        roomNumber: roomTenant.room.roomNumber,
                        propertyName: roomTenant.room.property.name,
                        reason: "Chưa có chỉ số cũ",
                    });
                    continue;
                }

                const electricityPrev = lastMeterReading.electricityCurrent;
                const waterPrev = lastMeterReading.waterCurrent;
                const electricityCurrent = electricityPrev;
                const waterCurrent = waterPrev;

                currentMeterReading = await prisma.meterReading.create({
                    data: {
                        month,
                        year,
                        roomId: roomTenant.room.id,
                        electricityPrev,
                        electricityCurrent,
                        waterPrev,
                        waterCurrent,
                        electricityUsage: 0,
                        waterUsage: 0,
                    }
                });
            }

            const electricityUsage = 0;
            const waterUsage = 0;
            const electricityAmount = 0;
            const waterAmount = 0;

            const baseRent = roomTenant.room.baseRent;
            const total = baseRent + electricityAmount + waterAmount;

            // 3. Create bill linked to the meter reading
            const bill = await prisma.bill.create({
                data: {
                    roomTenantId: roomTenant.id,
                    meterReadingId: currentMeterReading.id,
                    month,
                    year,
                    baseRent,
                    electricityUsage,
                    electricityAmount,
                    waterUsage,
                    waterAmount,
                    discount: 0,
                    total,
                    dueDate: new Date(dueDate),
                    status: "DRAFT",
                    invoice: {
                        create: {
                            token: crypto.randomUUID(),
                        },
                    },
                },
            });

            createdBills.push({
                id: bill.id,
                roomNumber: roomTenant.room.roomNumber,
                propertyName: roomTenant.room.property.name,
                tenantName: roomTenant.tenant.name,
            });
        }

        return NextResponse.json({
            success: true,
            created: createdBills.length,
            skipped: skippedRooms.length,
            createdBills,
            skippedRooms,
            message: `Đã tạo ${createdBills.length} hóa đơn nháp. ${skippedRooms.length > 0 ? `Bỏ qua ${skippedRooms.length} phòng do chưa có chỉ số.` : ""}`,
        });
    } catch (error) {
        console.error("Bulk bill creation error:", error);
        return NextResponse.json(
            { error: "Không thể tạo hóa đơn hàng loạt" },
            { status: 500 }
        );
    }
}
