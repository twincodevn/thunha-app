import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContractExpiryZNS, formatDateVN } from "@/lib/zalo";

/**
 * GET /api/cron/zns-contract-expiry
 * Chạy hàng ngày — gửi ZNS nhắc hợp đồng sắp hết hạn (30 và 7 ngày)
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        // Tìm hợp đồng hết hạn trong 30 ngày tới
        const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const expiringContracts = await prisma.roomTenant.findMany({
            where: {
                isActive: true,
                endDate: {
                    gte: now,
                    lte: soon,
                },
            },
            include: {
                tenant: { select: { name: true, phone: true } },
                room: {
                    select: {
                        roomNumber: true,
                        property: { select: { name: true, userId: true } },
                    },
                },
            },
        });

        let sentCount = 0;
        let errorCount = 0;

        for (const contract of expiringContracts) {
            if (!contract.endDate || !contract.tenant.phone) continue;

            const daysLeft = Math.ceil(
                (contract.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Chỉ gửi vào ngày thứ 30, 14, 7
            if (![30, 14, 7].includes(daysLeft)) continue;

            const landlordUserId = contract.room.property.userId;
            const result = await sendContractExpiryZNS(landlordUserId, contract.tenant.phone, {
                tenant_name: contract.tenant.name,
                room_number: contract.room.roomNumber,
                property_name: contract.room.property.name,
                end_date: formatDateVN(contract.endDate),
                days_left: String(daysLeft),
            });

            if (result.success) sentCount++;
            else errorCount++;
        }

        return NextResponse.json({
            success: true,
            sentCount,
            errorCount,
            processedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Cron ZNS Contract Expiry] Error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
