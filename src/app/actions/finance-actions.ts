"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export interface MonthlyFinancialData {
    month: string;
    revenue: number;
    expenses: number;
    noi: number; // Net Operating Income
}

export interface FinancialSummary {
    totalRevenue: number;
    totalExpenses: number;
    noi: number;
    revenueGrowth: number;
    expenseGrowth: number;
    monthlyData: MonthlyFinancialData[];
}

function calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

export async function getFinancialSummary(monthsToLookBack = 6): Promise<FinancialSummary | { error: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { error: "Unauthorized" };

        const userId = session.user.id;
        const now = new Date();

        const startCurrentMonth = startOfMonth(now);
        const endCurrentMonth = endOfMonth(now);
        const startLastMonth = startOfMonth(subMonths(now, 1));
        const endLastMonth = endOfMonth(subMonths(now, 1));

        // Batch: fetch all data in the full range with just 2 queries
        const rangeStart = startOfMonth(subMonths(now, monthsToLookBack - 1));

        const [allPayments, allIncidents, currentRevenue, lastRevenue, currentExpenses, lastExpenses] = await Promise.all([
            // All payments in range for monthly breakdown
            prisma.payment.findMany({
                where: {
                    paidAt: { gte: rangeStart, lte: endCurrentMonth },
                    bill: { roomTenant: { room: { property: { userId } } } }
                },
                select: { amount: true, paidAt: true }
            }),
            // All incidents in range for monthly breakdown
            prisma.incident.findMany({
                where: {
                    createdAt: { gte: rangeStart, lte: endCurrentMonth },
                    property: { userId }
                },
                select: { cost: true, createdAt: true }
            }),
            // Current month revenue
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    paidAt: { gte: startCurrentMonth, lte: endCurrentMonth },
                    bill: { roomTenant: { room: { property: { userId } } } }
                }
            }),
            // Last month revenue
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    paidAt: { gte: startLastMonth, lte: endLastMonth },
                    bill: { roomTenant: { room: { property: { userId } } } }
                }
            }),
            // Current month expenses
            prisma.incident.aggregate({
                _sum: { cost: true },
                where: {
                    createdAt: { gte: startCurrentMonth, lte: endCurrentMonth },
                    property: { userId }
                }
            }),
            // Last month expenses
            prisma.incident.aggregate({
                _sum: { cost: true },
                where: {
                    createdAt: { gte: startLastMonth, lte: endLastMonth },
                    property: { userId }
                }
            }),
        ]);

        const currentRevAmount = currentRevenue._sum.amount || 0;
        const lastRevAmount = lastRevenue._sum.amount || 0;
        const currentExpAmount = currentExpenses._sum.cost || 0;
        const lastExpAmount = lastExpenses._sum.cost || 0;

        // Build monthly data from batch results (no additional queries!)
        const monthlyData: MonthlyFinancialData[] = [];

        for (let i = monthsToLookBack - 1; i >= 0; i--) {
            const date = subMonths(now, i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);
            const monthLabel = format(date, "MM/yyyy");

            const r = allPayments
                .filter(p => p.paidAt >= start && p.paidAt <= end)
                .reduce((sum, p) => sum + p.amount, 0);

            const e = allIncidents
                .filter(inc => inc.createdAt >= start && inc.createdAt <= end)
                .reduce((sum, inc) => sum + (inc.cost || 0), 0);

            monthlyData.push({
                month: monthLabel,
                revenue: r,
                expenses: e,
                noi: r - e
            });
        }

        return {
            totalRevenue: currentRevAmount,
            totalExpenses: currentExpAmount,
            noi: currentRevAmount - currentExpAmount,
            revenueGrowth: calculateGrowth(currentRevAmount, lastRevAmount),
            expenseGrowth: calculateGrowth(currentExpAmount, lastExpAmount),
            monthlyData
        };

    } catch (error) {
        console.error("Error fetching financial summary:", error);
        return { error: "Failed to fetch financial data" };
    }
}

