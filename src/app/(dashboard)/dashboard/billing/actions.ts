
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Helper type for Property Services
interface Service {
    name: string;
    price: number;
}

export async function getBillableTenants(propertyId: string, month: number, year: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Get property to fetch rates and services
    const property = await prisma.property.findUnique({
        where: { id: propertyId, userId: session.user.id },
        include: {
            rooms: {
                where: { status: "OCCUPIED" },
                include: {
                    roomTenants: {
                        where: { isActive: true },
                        include: { tenant: true }
                    },
                    meterReadings: {
                        where: { month, year }
                    }
                }
            }
        }
    });

    if (!property) throw new Error("Property not found");

    const billableItems = [];

    for (const room of property.rooms) {
        // Skip if no active tenant (shouldn't happen with status=OCCUPIED check but safety first)
        const activeTenant = room.roomTenants[0];
        if (!activeTenant) continue;

        // Check if bill already exists
        const existingBill = await prisma.bill.findUnique({
            where: {
                roomTenantId_month_year: {
                    roomTenantId: activeTenant.id,
                    month,
                    year
                }
            }
        });

        if (existingBill) {
            // Bill already exists, maybe return it or skip?
            // For "Generate" page, we usually want to show items that NEED generation.
            // Let's mark it as generated.
            billableItems.push({
                status: "GENERATED",
                roomNumber: room.roomNumber,
                tenantName: activeTenant.tenant.name,
                billId: existingBill.id,
                total: existingBill.total
            });
            continue;
        }

        // Calculate Bill Preview
        const reading = room.meterReadings[0];

        const electricityUsage = reading?.electricityUsage ?? 0;
        const waterUsage = reading?.waterUsage ?? 0;

        const electricityAmount = electricityUsage * property.electricityRate;
        const waterAmount = waterUsage * property.waterRate;

        // Parse services
        let services: Service[] = [];
        try {
            if (property.services) {
                // Check if it's a string or object. Prisma types it as Json, so it could be anything.
                services = (typeof property.services === 'string'
                    ? JSON.parse(property.services)
                    : property.services) as Service[];
            }
        } catch (e) {
            console.error("Failed to parse services", e);
        }

        const servicesTotal = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

        const total = room.baseRent + electricityAmount + waterAmount + servicesTotal;

        billableItems.push({
            status: "PENDING",
            roomTenantId: activeTenant.id,
            roomId: room.id,
            roomNumber: room.roomNumber,
            tenantName: activeTenant.tenant.name,

            baseRent: room.baseRent,

            // Readings linkage
            meterReadingId: reading?.id,
            hasReading: !!reading,

            electricityUsage,
            electricityRate: property.electricityRate,
            electricityAmount,

            waterUsage,
            waterRate: property.waterRate,
            waterAmount,

            services,
            servicesTotal,

            total
        });
    }

    return {
        success: true,
        items: billableItems,
        property: {
            name: property.name,
            electricityRate: property.electricityRate,
            waterRate: property.waterRate
        }
    };
}

const createBillSchema = z.object({
    roomTenantId: z.string(),
    month: z.number(),
    year: z.number(),
    meterReadingId: z.string().optional(),
    baseRent: z.number(),
    electricityAmount: z.number(),
    electricityUsage: z.number(),
    waterAmount: z.number(),
    waterUsage: z.number(),
    services: z.array(z.object({ name: z.string(), price: z.number() })),
    total: z.number(),
    dueDate: z.string(), // ISO Date string
});

export async function createBills(bills: z.infer<typeof createBillSchema>[]) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await prisma.$transaction(
            bills.map(bill =>
                prisma.bill.create({
                    data: {
                        roomTenantId: bill.roomTenantId,
                        month: bill.month,
                        year: bill.year,
                        meterReadingId: bill.meterReadingId,
                        baseRent: bill.baseRent,
                        electricityAmount: bill.electricityAmount,
                        electricityUsage: bill.electricityUsage,
                        waterAmount: bill.waterAmount,
                        waterUsage: bill.waterUsage,
                        extraCharges: bill.services, // Storing services as extraCharges JSON
                        total: bill.total,
                        dueDate: new Date(bill.dueDate),
                        status: "PENDING",
                    }
                })
            )
        );

        revalidatePath("/dashboard/billing");
        return { success: true, count: bills.length };
    } catch (error: any) {
        console.error("Create bills error:", error);
        return { error: error.message || "Failed to create bills" };
    }
}

export async function getBills(propertyId?: string, month?: number, year?: number, status?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const where: any = {
        roomTenant: {
            room: {
                property: {
                    userId: session.user.id
                }
            }
        }
    };

    if (propertyId) {
        where.roomTenant.room = { propertyId };
    }
    if (month) where.month = month;
    if (year) where.year = year;
    if (status && status !== "ALL") where.status = status;

    const bills = await prisma.bill.findMany({
        where,
        include: {
            roomTenant: {
                include: {
                    tenant: true,
                    room: {
                        include: {
                            property: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return bills;
}

export async function getBill(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const bill = await prisma.bill.findUnique({
        where: { id },
        include: {
            roomTenant: {
                include: {
                    tenant: true,
                    room: {
                        include: {
                            property: true
                        }
                    }
                }
            },
            meterReading: true,
            payments: true
        }
    });

    if (!bill) return null;

    // Check ownership
    if (bill.roomTenant.room.property.userId !== session.user.id) {
        throw new Error("Unauthorized");
    }

    return bill;
}

export async function updateBillStatus(id: string, status: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await prisma.bill.update({
            where: { id },
            data: { status: status as any }
        });
        revalidatePath("/dashboard/billing");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update status" };
    }
}

export async function confirmPayment(data: {
    billId: string;
    amount: number;
    method: "CASH" | "BANK_TRANSFER" | "VNPAY" | "MOMO";
    note?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const bill = await prisma.bill.findUnique({
            where: { id: data.billId },
            include: {
                roomTenant: {
                    include: {
                        room: {
                            include: {
                                property: true
                            }
                        }
                    }
                }
            }
        });

        if (!bill) return { error: "Bill not found" };

        if (bill.roomTenant.room.property.userId !== session.user.id) {
            return { error: "Unauthorized" };
        }

        await prisma.$transaction([
            // Create payment record
            prisma.payment.create({
                data: {
                    billId: data.billId,
                    amount: data.amount,
                    method: data.method,
                    note: data.note,
                    paidAt: new Date()
                }
            }),
            // Update bill status
            prisma.bill.update({
                where: { id: data.billId },
                data: { status: "PAID" }
            })
        ]);

        revalidatePath("/dashboard/billing");
        revalidatePath(`/dashboard/billing/${data.billId}`);

        return { success: true };
    } catch (error) {
        console.error("Confirm payment error:", error);
        return { error: "Failed to confirm payment" };
    }
}

export async function sendReminderEmail(billId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    // Mock implementation
    console.log(`Sending reminder email for bill ${billId}`);
    return { success: true, message: "Email nhắc nhở đã được gửi (Mock)" };
}

export async function generateSMSMessage(billId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: {
                roomTenant: {
                    include: {
                        room: {
                            include: { property: true }
                        },
                        tenant: true
                    }
                }
            }
        });

        if (!bill) return { error: "Bill not found" };

        const message = `Chao ${bill.roomTenant.tenant.name}, vui long thanh toan tien can ho ${bill.roomTenant.room.roomNumber} thang ${bill.month}. Tong: ${bill.total.toLocaleString('vi-VN')}d. Lien he: ${bill.roomTenant.room.property.userId}`;

        return {
            success: true,
            message,
            phone: bill.roomTenant.tenant.phone
        };
    } catch (error) {
        return { error: "Failed to generate SMS" };
    }
}

export async function sendBillEmail(billId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    // Mock implementation
    console.log(`Sending bill email for bill ${billId}`);
    return { success: true, message: "Hóa đơn đã được gửi qua email (Mock)" };
}
