"use server";

import { auth } from "@/lib/auth";
import { calculateElectricityCost, formatDate } from "@/lib/billing";
import { sendInvoiceEmail, sendPaymentReminder } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { sendBillCreatedZNS, sendPaymentConfirmedZNS, formatCurrencyVND, formatDateVN } from "@/lib/zalo";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendPushToTenant } from "@/lib/push";

// Helper type for Property Services
interface Service {
  name: string;
  price: number;
}

export async function getBillableTenants(
  propertyId: string,
  month: number,
  year: number,
) {
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
            include: { tenant: true },
          },
          meterReadings: {
            where: { month, year },
          },
        },
      },
    },
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
          year,
        },
      },
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
        total: existingBill.total,
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
        services = (
          typeof property.services === "string"
            ? JSON.parse(property.services)
            : property.services
        ) as Service[];
      }
    } catch (e) {
      console.error("Failed to parse services", e);
    }

    const servicesTotal = services.reduce(
      (sum, s) => sum + (Number(s.price) || 0),
      0,
    );

    const total =
      room.baseRent + electricityAmount + waterAmount + servicesTotal;

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

      total,
    });
  }

  return {
    success: true,
    items: billableItems,
    property: {
      name: property.name,
      electricityRate: property.electricityRate,
      waterRate: property.waterRate,
    },
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
      bills.map((bill) =>
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
          },
        }),
      ),
    );

    // Create Invoice records for each bill to generate public tokens
    await prisma.$transaction(
      createdBills.map((bill) =>
        prisma.invoice.create({
          data: {
            billId: bill.id,
            // token is auto-generated by cuid() in schema
          },
        }),
      ),
    );

    // Fetch RoomTenants to get Tenant IDs for Notifications
    const roomTenants = await prisma.roomTenant.findMany({
      where: { id: { in: bills.map((b) => b.roomTenantId) } },
      include: { room: true },
    });

    const notifications: any[] = [];
    for (const bill of createdBills) {
      const rt = roomTenants.find((r) => r.id === bill.roomTenantId);
      if (rt && rt.tenantId) {
        notifications.push({
          tenantId: rt.tenantId,
          title: "Có hóa đơn mới",
          message: `Hóa đơn tháng ${bill.month}/${bill.year} của phòng ${rt.room.roomNumber
            } đã được tạo. Số tiền: ${bill.total.toLocaleString("vi-VN")}đ.`,
          type: "BILL",
          link: "/portal/bills",
        });
      }
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });

      // 🔔 Web Push: gửi push cho từng tenant (best-effort)
      for (const notif of notifications) {
        if (notif.tenantId) {
          sendPushToTenant({
            tenantId: notif.tenantId,
            title: notif.title,
            message: notif.message,
            url: notif.link,
          }).catch((e) => console.warn("[Push] Bill notification failed:", e));
        }
      }
    }

    // 🔔 Fire ZNS for each bill (best-effort, non-blocking)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    for (const bill of createdBills) {
      const rt = roomTenants.find((r) => r.id === bill.roomTenantId);
      if (!rt) continue;

      // Fetch tenant phone + invoice token + property name
      const fullRt = await prisma.roomTenant.findUnique({
        where: { id: bill.roomTenantId },
        include: {
          tenant: { select: { phone: true, name: true } },
          room: { include: { property: { select: { name: true, userId: true } } } },
        },
      });
      const invoice = await prisma.invoice.findUnique({ where: { billId: bill.id } });

      if (fullRt?.tenant.phone) {
        sendBillCreatedZNS(fullRt.room.property.userId, fullRt.tenant.phone, {
          tenant_name: fullRt.tenant.name,
          room_number: fullRt.room.roomNumber,
          property_name: fullRt.room.property.name,
          month: `Tháng ${bill.month}/${bill.year}`,
          amount: formatCurrencyVND(bill.total),
          due_date: formatDateVN(new Date(bill.dueDate)),
          invoice_url: invoice?.token ? `${appUrl}/invoice/${invoice.token}` : appUrl,
        }).catch((e) => console.warn("[ZNS] Bill created send failed:", e));
      }
    }

    revalidatePath("/dashboard/billing");
    return { success: true, count: bills.length };
  } catch (error: any) {
    console.error("Create bills error:", error);
    return { error: error.message || "Failed to create bills" };
  }
}

export async function getBills(
  propertyId?: string,
  month?: number,
  year?: number,
  status?: string,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const where: any = {
    roomTenant: {
      room: {
        property: {
          userId: session.user.id,
        },
      },
    },
  };

  if (propertyId) {
    where.roomTenant.room = {
      propertyId,
      property: { userId: session.user.id },
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
              property: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
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
              property: {
                include: {
                  user: {
                    select: {
                      bankName: true,
                      bankAccountNumber: true,
                      bankAccountName: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      meterReading: true,
      payments: true,
      invoice: true,
    },
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
        roomTenant: { room: { property: { userId: session.user.id } } },
      },
    });

    if (!bill) return { error: "Không tìm thấy hóa đơn" };

    await prisma.bill.update({
      where: { id },
      data: { status: status as any },
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
                property: true,
              },
            },
          },
        },
        payments: true,
      },
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
          paidAt: new Date(),
        },
      }),
      // Only update to PAID if fully paid
      prisma.bill.update({
        where: { id: data.billId },
        data: { status: newStatus },
      }),
    ]);

    revalidatePath("/dashboard/billing");
    revalidatePath(`/dashboard/billing/${data.billId}`);

    // 🔔 ZNS + Web Push: Xác nhận thanh toán nếu đã đủ tiền
    if (newStatus === "PAID") {
      const fullBill = await prisma.bill.findUnique({
        where: { id: data.billId },
        include: {
          roomTenant: {
            include: {
              tenant: { select: { id: true, phone: true, name: true } },
              room: { include: { property: { select: { name: true, userId: true } } } },
            },
          },
        },
      });
      if (fullBill) {
        const methodLabel: Record<string, string> = {
          CASH: "Tiền mặt", BANK_TRANSFER: "Chuyển khoản", VNPAY: "VNPay", MOMO: "MoMo",
        };
        // ZNS
        if (fullBill.roomTenant.tenant.phone) {
          sendPaymentConfirmedZNS(fullBill.roomTenant.room.property.userId, fullBill.roomTenant.tenant.phone, {
            tenant_name: fullBill.roomTenant.tenant.name,
            room_number: fullBill.roomTenant.room.roomNumber,
            amount: formatCurrencyVND(data.amount),
            month: `Tháng ${fullBill.month}/${fullBill.year}`,
            payment_method: methodLabel[data.method] || data.method,
          }).catch((e) => console.warn("[ZNS] Payment confirmed send failed:", e));
        }
        // Web Push
        sendPushToTenant({
          tenantId: fullBill.roomTenant.tenantId,
          title: "✅ Xác nhận thanh toán",
          message: `Phòng ${fullBill.roomTenant.room.roomNumber} – Tháng ${fullBill.month}/${fullBill.year}: ${formatCurrencyVND(data.amount)}`,
          url: "/portal/bills",
        }).catch((e) => console.warn("[Push] Payment confirmed failed:", e));
      }
    }

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
            tenant: true,
          },
        },
        invoice: true,
      },
    });

    if (!bill) return { error: "Không tìm thấy hóa đơn" };

    const tenantEmail = bill.roomTenant.tenant.email;
    if (!tenantEmail) return { error: "Khách thuê chưa cập nhật email" };

    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(bill.dueDate).getTime()) /
      (1000 * 60 * 60 * 24),
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
      invoiceUrl,
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
                  include: { user: true },
                },
              },
            },
            tenant: true,
          },
        },
      },
    });

    if (!bill) return { error: "Bill not found" };

    const landlordPhone =
      bill.roomTenant.room.property.user.phone ||
      bill.roomTenant.room.property.user.email ||
      "chu tro";

    const message = `Chao ${bill.roomTenant.tenant.name
      }, vui long thanh toan tien phong ${bill.roomTenant.room.roomNumber
      } thang ${bill.month}. Tong: ${bill.total.toLocaleString(
        "vi-VN",
      )}d. Lien he: ${landlordPhone}`;

    return {
      success: true,
      message,
      phone: bill.roomTenant.tenant.phone,
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
            tenant: true,
          },
        },
        invoice: true,
      },
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
      invoiceUrl: invoiceLink,
    });

    if (!result.success) {
      return { error: "Gửi email thất bại. Vui lòng kiểm tra API Key." };
    }

    // Update sent status
    if (bill.invoice) {
      await prisma.invoice.update({
        where: { id: bill.invoice.id },
        data: { sentVia: "EMAIL", sentAt: new Date() },
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
        const message = `Chao ${bill.roomTenant.tenant.name
          }, vui long thanh toan tien phong ${bill.roomTenant.room.roomNumber
          } thang ${bill.month}. Tong: ${bill.total.toLocaleString(
            "vi-VN",
          )}d. Lien he: ${landlordPhone || "chu tro"}`;
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
