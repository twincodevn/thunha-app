
import { prisma } from "@/lib/prisma";

export interface Insight {
    id: string;
    type: "ANOMALY" | "OPPORTUNITY" | "WARNING" | "INFO";
    title: string;
    description: string;
    actionLabel?: string;
    actionUrl?: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    icon: string; // Lucide icon name
}

export async function getSmartInsights(userId: string): Promise<Insight[]> {
    const insights: Insight[] = [];

    // 1. Check for Overdue Bills (Revenue Opportunity)
    const overdueBills = await prisma.bill.findMany({
        where: {
            roomTenant: { room: { property: { userId } } },
            status: "OVERDUE",
        },
        select: {
            total: true, // removed amount
            roomTenant: { include: { room: true, tenant: true } }
        }
    });

    if (overdueBills.length > 0) {
        const totalOverdue = overdueBills.reduce((sum, bill) => sum + bill.total, 0);
        insights.push({
            id: "overdue-bills",
            type: "WARNING",
            title: "Cảnh báo nợ quá hạn",
            description: `Bạn có ${overdueBills.length} hóa đơn quá hạn với tổng số tiền ${totalOverdue.toLocaleString('vi-VN')}đ.`,
            actionLabel: "Xem danh sách nợ",
            actionUrl: "/dashboard/billing?status=OVERDUE",
            priority: "HIGH",
            icon: "AlertOctagon"
        });
    }

    // 2. Check for Expiring Contracts (Vacancy Risk)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringContracts = await prisma.roomTenant.findMany({
        where: {
            room: { property: { userId } },
            endDate: {
                lte: thirtyDaysFromNow,
                gte: new Date(), // Not already expired
            },
            isActive: true // changed from status: "ACTIVE"
        },
        include: { room: true, tenant: true }
    });

    if (expiringContracts.length > 0) {
        insights.push({
            id: "expiring-contracts",
            type: "INFO",
            title: "Hợp đồng sắp hết hạn",
            description: `Có ${expiringContracts.length} phòng sắp hết hạn hợp đồng trong 30 ngày tới. Hãy liên hệ gia hạn hoặc tìm khách mới.`,
            actionLabel: "Kiểm tra ngay",
            actionUrl: "/dashboard/tenants?status=EXPIRING",
            priority: "MEDIUM",
            icon: "CalendarClock"
        });
    }

    // 3. Check for Utility Usage Spikes (Anomaly Detection)
    // Compare this month vs last month for active rooms
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const spikedReadings = await prisma.meterReading.findMany({
        where: {
            room: { property: { userId } },
            month: currentMonth,
            year: currentYear,
            // Simple check: current usage > 50% more than prev usage? 
            // We need to fetch prev usage manually or join.
            // For MVP, let's just fetch readings and compare in JS
        },
        include: { room: true }
    });

    // We need prev readings to compare
    if (spikedReadings.length > 0) {
        const prevReadings = await prisma.meterReading.findMany({
            where: {
                room: { property: { userId } },
                month: prevMonth,
                year: prevYear
            }
        });

        let spikeCount = 0;
        let exampleRoom = "";

        for (const reading of spikedReadings) {
            const prev = prevReadings.find(r => r.roomId === reading.roomId);
            if (prev && prev.electricityUsage > 0) {
                const increase = (reading.electricityUsage - prev.electricityUsage) / prev.electricityUsage;
                if (increase > 0.5) { // 50% spike
                    spikeCount++;
                    exampleRoom = reading.room.roomNumber;
                }
            }
        }

        if (spikeCount > 0) {
            insights.push({
                id: "utility-spike",
                type: "ANOMALY",
                title: "Tiêu thụ điện tăng đột biến",
                description: `${spikeCount} phòng có chỉ số điện tăng >50% so với tháng trước (VD: Phòng ${exampleRoom}). Kiểm tra rò rỉ hoặc gian lận?`,
                actionLabel: "Xem chỉ số",
                actionUrl: "/dashboard/utilities",
                priority: "HIGH",
                icon: "ZapOff"
            });
        }
    }

    // 4. Check Vacancy Rate (Opportunity)
    const totalRooms = await prisma.room.count({ where: { property: { userId } } });
    const vacantRooms = await prisma.room.count({ where: { property: { userId }, status: "VACANT" } });

    if (totalRooms > 0 && (vacantRooms / totalRooms) > 0.3) {
        const rate = Math.round((vacantRooms / totalRooms) * 100);
        insights.push({
            id: "high-vacancy",
            type: "OPPORTUNITY",
            title: "Tỷ lệ trống phòng cao",
            description: `Tỷ lệ trống là ${rate}%. Cân nhắc đăng tin tìm khách hoặc chạy khuyến mãi giảm giá?`,
            actionLabel: "Đăng tin ngay",
            actionUrl: "/listings",
            priority: "MEDIUM",
            icon: "TrendingUp"
        });
    }

    return insights.sort((a, b) => {
        const priorities = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorities[b.priority] - priorities[a.priority];
    });
}
