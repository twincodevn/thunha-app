import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { differenceInDays } from "date-fns";

// This endpoint should be protected by a Vercel Cron Secret in production
// E.g., check headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`
export async function GET(request: Request) {
    // For local dev and demo purposes, we will allow open access
    // if (process.env.CRON_SECRET && request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    //    return new NextResponse("Unauthorized", { status: 401 });
    // }

    try {
        const today = new Date();

        // Find all OVERDUE bills that belong to properties with lateFee > 0
        const overdueBills = await prisma.bill.findMany({
            where: {
                status: "OVERDUE",
                roomTenant: {
                    room: {
                        property: {
                            lateFee: { gt: 0 }
                        }
                    }
                }
            },
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

        const updates = [];

        for (const bill of overdueBills) {
            const property = bill.roomTenant.room.property;
            const lateFeeConfig = property.lateFee || 0;
            const lateFeeType = property.lateFeeType || "FIXED";

            // Only apply if due date has passed
            if (!bill.dueDate || new Date(bill.dueDate) >= today) continue;

            const daysLate = differenceInDays(today, new Date(bill.dueDate));
            if (daysLate <= 0) continue;

            let penaltyAmount = 0;

            if (lateFeeType === "FIXED") {
                penaltyAmount = lateFeeConfig * daysLate;
            } else if (lateFeeType === "PERCENTAGE") {
                // e.g., 1% of total per day
                const percentage = lateFeeConfig / 100;
                penaltyAmount = Number(bill.total) * percentage * daysLate;
            }

            // We will add this penalty as an 'extraCharge' to the existing billing array
            // Or just update the DB. For simplicity, we add it to a `penaltyFee` field or just update total.
            // Wait, does Bill have a penaltyFee field? Prisma schema doesn't show one right now.
            // Let's parse existing extraCharges JSON, or add a new entry.
            const extraCharges = (bill.extraCharges as any[]) || [];

            // Filter out old penalty charges so we don't duplicate them infinitely
            const cleanCharges = extraCharges.filter(c => c.name !== "Phí phạt trễ hạn");
            cleanCharges.push({
                name: "Phí phạt trễ hạn",
                amount: Math.round(penaltyAmount)
            });

            // Recalculate total
            const subtotal =
                Number(bill.baseRent) +
                Number(bill.electricityAmount) +
                Number(bill.waterAmount);

            const extraTotal = cleanCharges.reduce((sum, c) => sum + Number(c.amount), 0);
            const total = subtotal + extraTotal - Number(bill.discount);

            updates.push(
                prisma.bill.update({
                    where: { id: bill.id },
                    data: {
                        extraCharges: cleanCharges,
                        total
                    }
                })
            );
        }

        if (updates.length > 0) {
            await prisma.$transaction(updates);
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${updates.length} overdue bills for late fees.`
        });
    } catch (error) {
        console.error("Cron Late Fees Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
