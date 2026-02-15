
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendInvoiceEmail, sendPaymentReminder } from "@/lib/email";
import { formatDate, calculateElectricityCost } from "@/lib/billing";

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

        const electricityAmount = calculateElectricityCost(electricityUsage);
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
        const createdBills = await prisma.$transaction(
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
                        extraCharges: bill.services,
                        total: bill.total,
                        dueDate: new Date(bill.dueDate),
                        status: "PENDING",
                    }
                })
            )
        );

        // Create Invoice records for each bill to generate public tokens
        await prisma.$transaction(
            createdBills.map(bill =>
                prisma.invoice.create({
                    data: {
                        billId: bill.id,
                        // token is auto-generated by cuid() in schema
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
        where.roomTenant.room = {
            propertyId,
            property: { userId: session.user.id }
        };
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
            payments: true,
            invoice: true
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
        // Verify ownership before updating
        const bill = await prisma.bill.findFirst({
            where: {
                id,
                roomTenant: { room: { property: { userId: session.user.id } } }
            }
        });

        if (!bill) return { error: "Không tìm thấy hóa đơn" };

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
                },
                payments: true
            }
        });

        if (!bill) return { error: "Bill not found" };

        if (bill.roomTenant.room.property.userId !== session.user.id) {
            return { error: "Unauthorized" };
        }

        // Calculate total paid including this new payment
        const previouslyPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
        const totalPaid = previouslyPaid + data.amount;
        const newStatus = totalPaid >= bill.total ? "PAID" : bill.status;

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
            // Only update to PAID if fully paid
            prisma.bill.update({
                where: { id: data.billId },
                data: { status: newStatus }
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

    try {
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: {
                roomTenant: {
                    include: {
                        room: { include: { property: true } },
                        tenant: true
                    }
                },
                invoice: true
            }
        });

        if (!bill) return { error: "Không tìm thấy hóa đơn" };

        const tenantEmail = bill.roomTenant.tenant.email;
        if (!tenantEmail) return { error: "Khách thuê chưa cập nhật email" };

        const daysOverdue = Math.floor(
            (new Date().getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        const invoiceUrl = bill.invoice?.token
            ? `${process.env.AUTH_URL}/invoice/${bill.invoice.token}`
            : "#";

        const result = await sendPaymentReminder({
            to: tenantEmail,
            tenantName: bill.roomTenant.tenant.name,
            propertyName: bill.roomTenant.room.property.name,
            roomNumber: bill.roomTenant.room.roomNumber,
            month: bill.month,
            year: bill.year,
            total: bill.total,
            daysOverdue: Math.max(1, daysOverdue),
            invoiceUrl
        });

        if (!result.success) {
            return { error: "Gửi email thất bại: " + result.error };
        }

        return { success: true, message: "Đã gửi email nhắc nhở" };
    } catch (error) {
        console.error("Send reminder error:", error);
        return { error: "Lỗi hệ thống khi gửi email" };
    }
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
                            include: {
                                property: {
                                    include: { user: true }
                                }
                            }
                        },
                        tenant: true
                    }
                }
            }
        });

        if (!bill) return { error: "Bill not found" };

        const landlordPhone = bill.roomTenant.room.property.user.phone || bill.roomTenant.room.property.user.email || "chu tro";

        const message = `Chao ${bill.roomTenant.tenant.name}, vui long thanh toan tien phong ${bill.roomTenant.room.roomNumber} thang ${bill.month}. Tong: ${bill.total.toLocaleString('vi-VN')}d. Lien he: ${landlordPhone}`;

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

    try {
        const bill = await prisma.bill.findUnique({
            where: { id: billId },
            include: {
                roomTenant: {
                    include: {
                        room: { include: { property: true } },
                        tenant: true
                    }
                },
                invoice: true
            }
        });

        if (!bill) return { error: "Không tìm thấy hóa đơn" };

        const tenantEmail = bill.roomTenant.tenant.email;
        if (!tenantEmail) return { error: "Khách thuê chưa cập nhật email" };

        const invoiceLink = bill.invoice?.token
            ? `${process.env.AUTH_URL}/invoice/${bill.invoice.token}`
            : "#";

        const result = await sendInvoiceEmail({
            to: tenantEmail,
            tenantName: bill.roomTenant.tenant.name,
            propertyName: bill.roomTenant.room.property.name,
            roomNumber: bill.roomTenant.room.roomNumber,
            month: bill.month,
            year: bill.year,
            total: bill.total,
            dueDate: formatDate(bill.dueDate),
            invoiceUrl: invoiceLink
        });

        if (!result.success) {
            return { error: "Gửi email thất bại. Vui lòng kiểm tra API Key." };
        }

        // Update sent status
        if (bill.invoice) {
            await prisma.invoice.update({
                where: { id: bill.invoice.id },
                data: { sentVia: "EMAIL", sentAt: new Date() }
            });
        }

        return { success: true, message: "Đã gửi hóa đơn qua email" };
    } catch (error) {
        console.error("Send bill email error:", error);
        return { error: "Lỗi hệ thống khi gửi email" };
    }
}


export async function getBatchReminderData() {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized", bills: [] };

    try {
        const bills = await prisma.bill.findMany({
            where: {
                status: { in: ["PENDING", "OVERDUE"] },
                roomTenant: { room: { property: { userId: session.user.id } } },
            },
            include: {
                roomTenant: {
                    include: {
                        room: { include: { property: { include: { user: true } } } },
                        tenant: { select: { name: true, phone: true } },
                    },
                },
            },
            orderBy: { dueDate: "asc" },
        });

        const landlordPhone = bills[0]?.roomTenant.room.property.user.phone || "";

        return {
            bills: bills.map((bill) => {
                const message = `Chao ${bill.roomTenant.tenant.name}, vui long thanh toan tien phong ${bill.roomTenant.room.roomNumber} thang ${bill.month}. Tong: ${bill.total.toLocaleString("vi-VN")}d. Lien he: ${landlordPhone || "chu tro"}`;
                const phone = bill.roomTenant.tenant.phone;
                const zaloPhone = phone.startsWith("0") ? "84" + phone.slice(1) : phone;
                return {
                    id: bill.id,
                    tenantName: bill.roomTenant.tenant.name,
                    roomNumber: bill.roomTenant.room.roomNumber,
                    propertyName: bill.roomTenant.room.property.name,
                    phone,
                    total: bill.total,
                    status: bill.status,
                    month: bill.month,
                    dueDate: bill.dueDate.toISOString(),
                    message,
                    zaloLink: `https://zalo.me/${zaloPhone}`,
                    smsLink: `sms:${phone}?body=${encodeURIComponent(message)}`,
                };
            }),
        };
    } catch (error) {
        console.error("Batch reminder error:", error);
        return { error: "Lỗi tải dữ liệu", bills: [] };
    }
}
