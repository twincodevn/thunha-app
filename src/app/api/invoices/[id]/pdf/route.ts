import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF, InvoiceData } from "@/lib/pdf";
import { formatDate } from "@/lib/billing";
import { getBankByCode } from "@/lib/vietqr";
import { requireFeature } from "@/lib/feature-gate";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        const session = await auth();

        // 1. Find bill first with all necessary data
        const bill = await prisma.bill.findUnique({
            where: { id },
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

        // 2. Authorization check
        let authorized = false;
        let invoice = bill.invoice;
        let userId = bill.roomTenant.room.property.userId;

        // Either landlord session matches property OR token matches invoice
        if (session?.user && userId === session.user.id) {
            authorized = true;
        } else if (token && invoice?.token === token) {
            authorized = true;
        }

        if (!authorized) {
            return NextResponse.json({
                error: "Unauthorized",
                details: token ? "Token mismatch" : "Login required"
            }, { status: 401 });
        }

        // Feature gate: only BASIC+ can export PDF (landlord access only)
        if (session?.user && userId === session.user.id) {
            const gate = await requireFeature(session.user.id, "canExportPdf");
            if (gate) return gate;
        }

        // Get user info for landlord details
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create or get invoice (should already exist if using token)
        if (!invoice && bill) {
            invoice = await prisma.invoice.findUnique({
                where: { billId: bill.id }
            });
        }

        if (!invoice && bill) {
            invoice = await prisma.invoice.create({
                data: {
                    billId: bill.id,
                },
            });
        }

        if (!invoice || !bill) {
            return NextResponse.json({ error: "Invoice could not be loaded" }, { status: 500 });
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
            bank: user.bankName && user.bankAccountNumber ? {
                name: user.bankName,
                bin: getBankByCode(user.bankName)?.bin || "",
                accountNumber: user.bankAccountNumber,
                accountName: user.bankAccountName || undefined,
            } : undefined,
        };

        // Fetch QR code image if bank info exists
        let qrCodeDataURL: string | undefined = undefined;
        if (invoiceData.bank) {
            try {
                const qrUrl = `https://img.vietqr.io/image/${invoiceData.bank.bin}-${invoiceData.bank.accountNumber}-compact2.png?amount=${Math.round(bill.total)}&addInfo=${encodeURIComponent(`Tien phong T${bill.month}/${bill.year} - ${bill.roomTenant.room.roomNumber}`)}`;
                const qrResponse = await fetch(qrUrl);
                if (qrResponse.ok) {
                    const qrBuffer = await qrResponse.arrayBuffer();
                    qrCodeDataURL = `data:image/png;base64,${Buffer.from(qrBuffer).toString("base64")}`;
                }
            } catch (error) {
                console.error("Error fetching QR code for PDF:", error);
            }
        }

        const pdfBuffer = generateInvoicePDF({ ...invoiceData, qrCodeDataURL });

        // Return PDF as Buffer for best compatibility with Next.js Response
        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="hoadon-${bill.month}-${bill.year}.pdf"`,
                "Content-Length": pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("Invoice generation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
