"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * AI Revenue & Vacancy Forecasting
 * Uses historical data to predict future revenue, occupancy, and cash flow
 */
export async function getAIForecast() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Historical data: last 12 months of bills
    const historicalBills = await prisma.bill.findMany({
        where: {
            roomTenant: { room: { property: { userId } } },
            status: "PAID",
        },
        select: { month: true, year: true, total: true },
        orderBy: [{ year: "asc" }, { month: "asc" }],
    });

    // Current stats
    const [totalRooms, occupiedRooms, activeContracts] = await Promise.all([
        prisma.room.count({ where: { property: { userId } } }),
        prisma.room.count({ where: { property: { userId }, status: "OCCUPIED" } }),
        prisma.roomTenant.findMany({
            where: {
                room: { property: { userId } },
                isActive: true,
                endDate: { not: null },
            },
            select: { endDate: true, room: { select: { baseRent: true } } },
        }),
    ]);

    // Monthly revenue aggregation
    const monthlyRevenue: Record<string, number> = {};
    historicalBills.forEach((b) => {
        const key = `${b.year}-${String(b.month).padStart(2, "0")}`;
        monthlyRevenue[key] = (monthlyRevenue[key] || 0) + b.total;
    });

    const revenueValues = Object.values(monthlyRevenue);
    const avgMonthlyRevenue = revenueValues.length > 0
        ? revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length
        : 0;

    // Revenue trend (linear regression)
    let trend = 0;
    if (revenueValues.length >= 3) {
        const n = revenueValues.length;
        const midX = (n - 1) / 2;
        let sumXY = 0, sumXX = 0;
        revenueValues.forEach((y, x) => {
            sumXY += (x - midX) * (y - avgMonthlyRevenue);
            sumXX += (x - midX) * (x - midX);
        });
        trend = sumXX > 0 ? sumXY / sumXX : 0;
    }

    // Contracts expiring in next 3 months
    const expiringContracts = activeContracts.filter((c) => {
        if (!c.endDate) return false;
        const diff = (c.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 90;
    });

    const potentialVacancyLoss = expiringContracts.reduce(
        (sum, c) => sum + c.room.baseRent, 0
    );

    // Forecast next 6 months
    const forecast = Array.from({ length: 6 }, (_, i) => {
        const forecastMonth = ((currentMonth + i) % 12) + 1;
        const forecastYear = currentYear + Math.floor((currentMonth + i) / 12);
        const projectedRevenue = Math.max(0, avgMonthlyRevenue + trend * (revenueValues.length + i));

        // Adjust for expiring contracts
        let adjustedRevenue = projectedRevenue;
        const monthsAhead = i + 1;
        const expiringInMonth = expiringContracts.filter((c) => {
            if (!c.endDate) return false;
            return c.endDate.getMonth() + 1 === forecastMonth &&
                c.endDate.getFullYear() === forecastYear;
        });
        const lossThisMonth = expiringInMonth.reduce((s, c) => s + c.room.baseRent, 0);
        adjustedRevenue -= lossThisMonth * 0.5; // 50% chance of not renewing

        return {
            month: forecastMonth,
            year: forecastYear,
            label: `T${forecastMonth}/${forecastYear}`,
            projected: Math.round(projectedRevenue),
            adjusted: Math.round(Math.max(0, adjustedRevenue)),
            confidence: Math.max(40, 95 - i * 10), // confidence decreases over time
        };
    });

    // Insights
    const insights: { type: "positive" | "warning" | "info"; message: string }[] = [];

    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    if (occupancyRate >= 90) {
        insights.push({ type: "positive", message: `Tỷ lệ lấp đầy xuất sắc: ${occupancyRate.toFixed(0)}%` });
    } else if (occupancyRate < 70) {
        insights.push({ type: "warning", message: `Tỷ lệ lấp đầy thấp: ${occupancyRate.toFixed(0)}%. Cân nhắc giảm giá hoặc marketing.` });
    }

    if (trend > 0) {
        insights.push({ type: "positive", message: `Doanh thu đang tăng trưởng ${((trend / avgMonthlyRevenue) * 100).toFixed(1)}%/tháng` });
    } else if (trend < 0) {
        insights.push({ type: "warning", message: `Doanh thu có xu hướng giảm. Kiểm tra giá thuê và dịch vụ.` });
    }

    if (expiringContracts.length > 0) {
        insights.push({
            type: "warning",
            message: `${expiringContracts.length} hợp đồng sắp hết hạn trong 3 tháng tới (tiềm ẩn mất ${new Intl.NumberFormat("vi-VN").format(potentialVacancyLoss)}đ/tháng)`,
        });
    }

    if (revenueValues.length < 3) {
        insights.push({ type: "info", message: "Cần thêm dữ liệu (ít nhất 3 tháng) để dự báo chính xác hơn." });
    }

    return {
        current: {
            totalRooms,
            occupiedRooms,
            occupancyRate: Math.round(occupancyRate),
            avgMonthlyRevenue: Math.round(avgMonthlyRevenue),
            trendPercent: avgMonthlyRevenue > 0 ? ((trend / avgMonthlyRevenue) * 100) : 0,
        },
        forecast,
        insights,
        historical: Object.entries(monthlyRevenue)
            .slice(-12)
            .map(([key, value]) => ({ label: `T${key.split("-")[1]}`, value })),
    };
}
