"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail, sendPaymentReminder } from "@/lib/email";
import { formatDate } from "@/lib/billing";

export async function sendBillEmail(billId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    // Get bill with all related data
    const bill = await prisma.bill.findFirst({
        where: {
            id: billId,
            roomTenant: { room: { property: { userId: session.user.id } } },
        },
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

    if (!bill) {
        return { error: "Không tìm thấy hóa đơn" };
    }

    const tenantEmail = bill.roomTenant.tenant.email;
    if (!tenantEmail) {
        return { error: "Khách thuê chưa có email. Vui lòng cập nhật thông tin khách thuê." };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const invoiceUrl = bill.invoice?.token
        ? `${appUrl}/invoice/${bill.invoice.token}`
        : `${appUrl}/dashboard/billing/${bill.id}`;

    try {
        const result = await sendInvoiceEmail({
            to: tenantEmail,
            tenantName: bill.roomTenant.tenant.name,
            propertyName: bill.roomTenant.room.property.name,
            roomNumber: bill.roomTenant.room.roomNumber,
            month: bill.month,
            year: bill.year,
            total: bill.total,
            dueDate: formatDate(bill.dueDate),
            invoiceUrl,
        });

        if (!result.success) {
            return { error: result.error || "Không thể gửi email" };
        }

        // Update invoice sentAt if exists
        if (bill.invoice) {
            await prisma.invoice.update({
                where: { id: bill.invoice.id },
                data: { sentAt: new Date() },
            });
        }

        return {
            success: true,
            message: `Đã gửi email đến ${tenantEmail}`,
            messageId: result.messageId
        };
    } catch (error) {
        console.error("Send email error:", error);
        return { error: "Lỗi khi gửi email" };
    }
}

export async function sendReminderEmail(billId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const bill = await prisma.bill.findFirst({
        where: {
            id: billId,
            roomTenant: { room: { property: { userId: session.user.id } } },
        },
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
    });

    if (!bill) {
        return { error: "Không tìm thấy hóa đơn" };
    }

    const tenantEmail = bill.roomTenant.tenant.email;
    if (!tenantEmail) {
        return { error: "Khách thuê chưa có email" };
    }

    // Calculate paid and remaining amounts
    const paidAmount = bill.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = bill.total - paidAmount;

    if (remainingAmount <= 0) {
        return { error: "Hóa đơn đã thanh toán đủ" };
    }

    // Calculate days overdue
    const now = new Date();
    const dueDate = new Date(bill.dueDate);
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const invoiceUrl = bill.invoice?.token
        ? `${appUrl}/invoice/${bill.invoice.token}`
        : `${appUrl}/dashboard/billing/${bill.id}`;

    try {
        const result = await sendPaymentReminder({
            to: tenantEmail,
            tenantName: bill.roomTenant.tenant.name,
            propertyName: bill.roomTenant.room.property.name,
            roomNumber: bill.roomTenant.room.roomNumber,
            month: bill.month,
            year: bill.year,
            total: remainingAmount,
            daysOverdue,
            invoiceUrl,
        });

        if (!result.success) {
            return { error: result.error || "Không thể gửi nhắc nhở" };
        }

        return {
            success: true,
            message: `Đã gửi nhắc nhở đến ${tenantEmail}`,
            messageId: result.messageId
        };
    } catch (error) {
        console.error("Send reminder error:", error);
        return { error: "Lỗi khi gửi nhắc nhở" };
    }
}

// Generate SMS message content for manual sending
export async function generateSMSMessage(billId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const bill = await prisma.bill.findFirst({
        where: {
            id: billId,
            roomTenant: { room: { property: { userId: session.user.id } } },
        },
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
    });

    if (!bill) {
        return { error: "Không tìm thấy hóa đơn" };
    }

    const paidAmount = bill.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = bill.total - paidAmount;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const invoiceUrl = bill.invoice?.token
        ? `${appUrl}/invoice/${bill.invoice.token}`
        : `${appUrl}/dashboard/billing/${bill.id}`;

    const message = `[ThuNhà] Nhắc nhở tiền phòng T${bill.month}/${bill.year}
${bill.roomTenant.room.property.name} - Phòng ${bill.roomTenant.room.roomNumber}
Còn lại: ${formatCurrency(remainingAmount)}
Xem: ${invoiceUrl}
Hạn: ${formatDate(bill.dueDate)}`;

    return {
        success: true,
        message,
        phone: bill.roomTenant.tenant.phone,
    };
}

