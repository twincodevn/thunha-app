"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getTaxReport(year: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Batch fetch paid bills (income) and incidents (expenses)
    const [paidBills, incidents] = await Promise.all([
        prisma.bill.findMany({
            where: {
                year,
                status: "PAID",
                roomTenant: { room: { property: { userId } } },
            },
            select: {
                month: true,
                total: true,
                baseRent: true,
                electricityAmount: true,
                waterAmount: true,
                extraCharges: true,
            },
        }),
        prisma.incident.findMany({
            where: {
                property: { userId },
                createdAt: { gte: startDate, lte: endDate },
            },
            select: {
                cost: true,
                title: true,
                createdAt: true,
            },
        }),
    ]);

    // Monthly breakdown
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthBills = paidBills.filter((b) => b.month === i + 1);
        const monthIncidents = incidents.filter(
            (inc) => new Date(inc.createdAt).getMonth() === i
        );

        const rentIncome = monthBills.reduce((sum, b) => sum + b.baseRent, 0);
        const utilityIncome = monthBills.reduce(
            (sum, b) => sum + b.electricityAmount + b.waterAmount, 0
        );
        const serviceIncome = monthBills.reduce((sum, b) => {
            const extras = b.extraCharges as any;
            if (!extras || !Array.isArray(extras)) return sum;
            return sum + extras.reduce((s: number, e: any) => s + (e.amount || 0), 0);
        }, 0);
        const totalIncome = monthBills.reduce((sum, b) => sum + b.total, 0);
        const totalExpense = monthIncidents.reduce((sum, inc) => sum + (inc.cost || 0), 0);

        return {
            month: i + 1,
            monthName: `Tháng ${i + 1}`,
            rentIncome,
            utilityIncome,
            serviceIncome,
            totalIncome,
            totalExpense,
            netProfit: totalIncome - totalExpense,
        };
    });

    // Annual totals
    const totalIncome = monthlyData.reduce((sum, m) => sum + m.totalIncome, 0);
    const totalExpense = monthlyData.reduce((sum, m) => sum + m.totalExpense, 0);
    const netProfit = totalIncome - totalExpense;

    // Vietnamese PIT brackets for rental income (simplified)
    // Rental income tax = 5% VAT + 5% PIT = 10% total for individuals
    const estimatedTax = netProfit > 0 ? Math.round(netProfit * 0.1) : 0;
    const taxRate = 10; // %

    return {
        year,
        monthlyData,
        summary: {
            totalIncome,
            totalRentIncome: monthlyData.reduce((sum, m) => sum + m.rentIncome, 0),
            totalUtilityIncome: monthlyData.reduce((sum, m) => sum + m.utilityIncome, 0),
            totalServiceIncome: monthlyData.reduce((sum, m) => sum + m.serviceIncome, 0),
            totalExpense,
            netProfit,
            estimatedTax,
            taxRate,
        },
        topExpenses: incidents
            .filter((i) => i.cost && i.cost > 0)
            .sort((a, b) => (b.cost || 0) - (a.cost || 0))
            .slice(0, 5)
            .map((i) => ({ title: i.title, cost: i.cost || 0, date: i.createdAt.toISOString() })),
    };
}

export async function exportTaxCSV(year: number) {
    const data = await getTaxReport(year);

    const header = "Tháng,Thu nhập tiền phòng,Thu nhập điện nước,Thu nhập dịch vụ,Tổng thu,Chi phí,Lợi nhuận ròng";
    const rows = data.monthlyData.map(
        (m) =>
            `${m.monthName},${m.rentIncome},${m.utilityIncome},${m.serviceIncome},${m.totalIncome},${m.totalExpense},${m.netProfit}`
    );
    const summary = `\nTỔNG CỘNG,${data.summary.totalRentIncome},${data.summary.totalUtilityIncome},${data.summary.totalServiceIncome},${data.summary.totalIncome},${data.summary.totalExpense},${data.summary.netProfit}`;
    const tax = `\nThuế ước tính (${data.summary.taxRate}%),,,,,,"${data.summary.estimatedTax}"`;

    return [header, ...rows, summary, tax].join("\n");
}
