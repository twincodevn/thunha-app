import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvoiceEmail, sendPaymentReminder } from "@/lib/email";
import { formatDate } from "@/lib/billing";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const { type } = await request.json(); // "invoice" or "reminder"

        // Get bill with tenant email
        const bill = await prisma.bill.findFirst({
            where: {
                id,
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
            return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        }

        const tenantEmail = bill.roomTenant.tenant.email;
        if (!tenantEmail) {
            return NextResponse.json(
                { error: "Khách thuê chưa có email" },
                { status: 400 }
            );
        }

        // Get or create invoice
        let invoice = bill.invoice;
        if (!invoice) {
            invoice = await prisma.invoice.create({
                data: { billId: bill.id },
            });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const invoiceUrl = `${appUrl}/invoice/${invoice.token}`;

        if (type === "reminder") {
            // Calculate days overdue
            const now = new Date();
            const dueDate = new Date(bill.dueDate);
            const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            await sendPaymentReminder({
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

            // Update invoice sent info
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: { sentVia: "EMAIL_REMINDER", sentAt: new Date() },
            });
        } else {
            await sendInvoiceEmail({
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

            // Update invoice sent info
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: { sentVia: "EMAIL", sentAt: new Date() },
            });
        }

        return NextResponse.json({ success: true, message: "Email đã được gửi" });
    } catch (error) {
        console.error("Send email error:", error);
        return NextResponse.json({ error: "Không thể gửi email" }, { status: 500 });
    }
}
