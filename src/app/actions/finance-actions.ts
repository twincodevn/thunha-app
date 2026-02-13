"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format, startOfYear, endOfYear } from "date-fns";

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
    revenueGrowth: number; // vs last month/period
    expenseGrowth: number; // vs last month/period
    monthlyData: MonthlyFinancialData[];
}

// Helper to calculate percentage growth
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

        // Calculate current month metrics
        const startCurrentMonth = startOfMonth(now);
        const endCurrentMonth = endOfMonth(now);

        const startLastMonth = startOfMonth(subMonths(now, 1));
        const endLastMonth = endOfMonth(subMonths(now, 1));

        // Fetch payments (Revenue) for current and last month
        const currentRevenue = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                paidAt: { gte: startCurrentMonth, lte: endCurrentMonth },
                bill: {
                    roomTenant: {
                        room: { property: { userId } }
                    }
                }
            }
        });

        const lastRevenue = await prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                paidAt: { gte: startLastMonth, lte: endLastMonth },
                bill: {
                    roomTenant: {
                        room: { property: { userId } }
                    }
                }
            }
        });

        // Fetch incidents (Expenses) for current and last month
        // Note: Expenses are primarily tracked via Incidents currently. 
        // Future expansion might include a dedicated Expense model.
        const currentExpenses = await prisma.incident.aggregate({
            _sum: { cost: true },
            where: {
                createdAt: { gte: startCurrentMonth, lte: endCurrentMonth },
                property: { userId }
            }
        });

        const lastExpenses = await prisma.incident.aggregate({
            _sum: { cost: true },
            where: {
                createdAt: { gte: startLastMonth, lte: endLastMonth },
                property: { userId }
            }
        });

        const currentRevAmount = currentRevenue._sum.amount || 0;
        const lastRevAmount = lastRevenue._sum.amount || 0;
        const currentExpAmount = currentExpenses._sum.cost || 0;
        const lastExpAmount = lastExpenses._sum.cost || 0;

        // Monthly Trend Data
        const monthlyData: MonthlyFinancialData[] = [];

        for (let i = monthsToLookBack - 1; i >= 0; i--) {
            const date = subMonths(now, i);
            const start = startOfMonth(date);
            const end = endOfMonth(date);
            const monthLabel = format(date, "MM/yyyy");

            const rev = await prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    paidAt: { gte: start, lte: end },
                    bill: {
                        roomTenant: {
                            room: { property: { userId } }
                        }
                    }
                }
            });

            const exp = await prisma.incident.aggregate({
                _sum: { cost: true },
                where: {
                    createdAt: { gte: start, lte: end },
                    property: { userId }
                }
            });

            const r = rev._sum.amount || 0;
            const e = exp._sum.cost || 0;

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
