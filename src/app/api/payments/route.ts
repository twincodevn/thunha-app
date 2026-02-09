import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validators";

// GET all payments
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payments = await prisma.payment.findMany({
            where: {
                bill: { roomTenant: { room: { property: { userId: session.user.id } } } },
            },
            include: {
                bill: {
                    include: {
                        roomTenant: {
                            include: {
                                room: { include: { property: true } },
                                tenant: true,
                            },
                        },
                    },
                },
            },
            orderBy: { paidAt: "desc" },
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST record a payment
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = paymentSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json(
                { error: "Validation error", details: validated.error.flatten() },
                { status: 400 }
            );
        }

        const { billId, amount, method, note } = validated.data;

        // Verify bill ownership
        const bill = await prisma.bill.findFirst({
            where: {
                id: billId,
                roomTenant: { room: { property: { userId: session.user.id } } },
            },
        });

        if (!bill) {
            return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        }

        // Calculate total paid
        const existingPayments = await prisma.payment.aggregate({
            where: { billId },
            _sum: { amount: true },
        });

        const totalPaid = (existingPayments._sum.amount || 0) + amount;

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                billId,
                amount,
                method,
                note,
            },
        });

        // Update bill status if fully paid
        if (totalPaid >= bill.total) {
            await prisma.bill.update({
                where: { id: billId },
                data: { status: "PAID" },
            });
        }

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        console.error("Error recording payment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
