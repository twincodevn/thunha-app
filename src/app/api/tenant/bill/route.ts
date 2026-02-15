import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVietQRUrl, generatePaymentDescription, getBankBin } from "@/lib/vietqr";
import { formatCurrency } from "@/lib/billing";

/**
 * Public API route for tenant to view their bill via invoice token
 * No authentication required - accessed via unique token
 * GET /api/tenant/bill?token=xxx
 */
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { token },
            include: {
                bill: {
                    include: {
                        roomTenant: {
                            include: {
                                room: {
                                    include: {
                                        property: {
                                            include: {
                                                user: {
                                                    select: {
                                                        name: true,
                                                        phone: true,
                                                        email: true,
                                                        bankName: true,
                                                        bankAccountNumber: true,
                                                        bankAccountName: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                tenant: {
                                    select: { name: true, phone: true, email: true },
                                },
                            },
                        },
                        meterReading: true,
                        payments: {
                            orderBy: { paidAt: "desc" },
                            select: { amount: true, method: true, paidAt: true },
                        },
                    },
                },
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        // Mark as viewed
        if (!invoice.viewedAt) {
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: { viewedAt: new Date() },
            });
        }

        const bill = invoice.bill;
        const landlord = bill.roomTenant.room.property.user;
        const totalPaid = bill.payments.reduce((sum, p) => sum + p.amount, 0);
        const remaining = bill.total - totalPaid;

        // Generate VietQR if bank info available
        let qrUrl: string | null = null;
        if (landlord.bankName && landlord.bankAccountNumber && landlord.bankAccountName && remaining > 0) {
            const bankBin = getBankBin(landlord.bankName);
            if (bankBin) {
                qrUrl = generateVietQRUrl({
                    bankBin,
                    accountNumber: landlord.bankAccountNumber,
                    accountName: landlord.bankAccountName,
                    amount: remaining,
                    description: generatePaymentDescription({
                        billId: bill.id,
                        roomNumber: bill.roomTenant.room.roomNumber,
                        month: bill.month,
                        year: bill.year,
                    }),
                });
            }
        }

        return NextResponse.json({
            bill: {
                id: bill.id,
                month: bill.month,
                year: bill.year,
                baseRent: bill.baseRent,
                electricityAmount: bill.electricityAmount,
                electricityUsage: bill.electricityUsage,
                waterAmount: bill.waterAmount,
                waterUsage: bill.waterUsage,
                extraCharges: bill.extraCharges,
                discount: bill.discount,
                total: bill.total,
                status: bill.status,
                dueDate: bill.dueDate.toISOString(),
            },
            tenant: {
                name: bill.roomTenant.tenant.name,
            },
            room: {
                number: bill.roomTenant.room.roomNumber,
                property: bill.roomTenant.room.property.name,
                address: bill.roomTenant.room.property.address,
            },
            landlord: {
                name: landlord.name,
                phone: landlord.phone,
                bankName: landlord.bankName,
                bankAccountNumber: landlord.bankAccountNumber,
                bankAccountName: landlord.bankAccountName,
            },
            meterReading: bill.meterReading
                ? {
                    electricityPrev: bill.meterReading.electricityPrev,
                    electricityCurrent: bill.meterReading.electricityCurrent,
                    waterPrev: bill.meterReading.waterPrev,
                    waterCurrent: bill.meterReading.waterCurrent,
                }
                : null,
            payments: bill.payments.map((p) => ({
                amount: p.amount,
                method: p.method,
                paidAt: p.paidAt.toISOString(),
            })),
            totalPaid,
            remaining,
            qrUrl,
            viewedAt: invoice.viewedAt?.toISOString() || new Date().toISOString(),
        });
    } catch (error) {
        console.error("Tenant bill API error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
