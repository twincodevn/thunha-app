import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF, InvoiceData } from "@/lib/pdf";
import { formatDate } from "@/lib/billing";

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

        // Get bill with all related data
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

        // Get user info for landlord details
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create or get invoice
        let invoice = bill.invoice;
        if (!invoice) {
            invoice = await prisma.invoice.create({
                data: {
                    billId: bill.id,
                },
            });
        }

        // Generate PDF
        const invoiceData: InvoiceData = {
            invoiceNumber: `INV-${bill.year}${String(bill.month).padStart(2, "0")}-${invoice.id.slice(-6).toUpperCase()}`,
            date: formatDate(new Date()),
            dueDate: formatDate(bill.dueDate),
            landlord: {
                name: user.name,
                address: bill.roomTenant.room.property.address,
                phone: user.phone || undefined,
                email: user.email || undefined,
            },
            tenant: {
                name: bill.roomTenant.tenant.name,
                phone: bill.roomTenant.tenant.phone,
                email: bill.roomTenant.tenant.email || undefined,
            },
            property: {
                name: bill.roomTenant.room.property.name,
                address: bill.roomTenant.room.property.address,
                roomNumber: bill.roomTenant.room.roomNumber,
            },
            billing: {
                month: bill.month,
                year: bill.year,
                baseRent: bill.baseRent,
                electricityUsage: bill.electricityUsage,
                electricityAmount: bill.electricityAmount,
                waterUsage: bill.waterUsage,
                waterAmount: bill.waterAmount,
                extraCharges: bill.extraCharges as { name: string; amount: number }[] | undefined,
                discount: bill.discount,
                total: bill.total,
            },
        };

        const pdfBuffer = generateInvoicePDF(invoiceData);

        // Return PDF - convert Uint8Array to Buffer for NextResponse
        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="hoadon-${bill.month}-${bill.year}.pdf"`,
            },
        });
    } catch (error) {
        console.error("Invoice generation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
