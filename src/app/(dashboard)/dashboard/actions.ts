"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function getRevenueForecast() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // 1. Fetch historical billing data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const bills = await prisma.bill.findMany({
        where: {
            roomTenant: { room: { property: { userId: session.user.id } } },
            createdAt: { gte: sixMonthsAgo },
            status: "PAID",
        },
        select: {
            total: true,
            createdAt: true,
            month: true,
            year: true,
        },
        orderBy: { createdAt: "asc" },
    });

    // Sub-function to group by month
    const monthlyRevenue: Record<string, number> = {};
    bills.forEach((bill) => {
        const key = `${bill.month}/${bill.year}`;
        monthlyRevenue[key] = (monthlyRevenue[key] || 0) + bill.total;
    });

    const revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue,
    }));

    if (revenueData.length < 2) {
        return { error: "Not enough data to forecast" };
    }

    // 2. Call AI to predict next month
    try {
        const prompt = `
            You are a financial analyst for a rental property business.
            Analyze the following monthly revenue data (Month: Revenue in VND):
            ${JSON.stringify(revenueData)}

            Predict the revenue for the NEXT month.
            Return ONLY a valid JSON object with this structure:
            {
                "nextMonth": "MM/YYYY",
                "predictedRevenue": number,
                "confidence": "low" | "medium" | "high",
                "reasoning": "string explanation (max 20 words)"
            }
        `;

        const { text } = await generateText({
            model: google("gemini-1.5-flash"),
            prompt: prompt,
            temperature: 0.2,
        });

        const cleanText = text.replace(/```json|```/g, "").trim();
        const forecast = JSON.parse(cleanText);

        return { success: true, data: forecast, history: revenueData };
    } catch (error) {
        console.error("AI Forecast Error:", error);
        return { error: "Failed to generate forecast" };
    }
}
