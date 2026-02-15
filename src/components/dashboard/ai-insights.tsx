"use client";

import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, ArrowUpRight, DollarSign, Home, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/billing";

interface AIInsightsProps {
    occupiedRooms: number;
    totalRooms: number;
    collected: number;
    expectedIncome: number;
    pendingBills: number;
    overdueBills: number;
}

interface Insight {
    icon: React.ReactNode;
    title: string;
    value: string;
    description: string;
    trend: "up" | "down" | "neutral" | "warning";
    color: string;
}

export function AIInsights({
    occupiedRooms,
    totalRooms,
    collected,
    expectedIncome,
    pendingBills,
    overdueBills,
}: AIInsightsProps) {
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    const collectionRate = expectedIncome > 0 ? (collected / expectedIncome) * 100 : 0;
    const vacantRooms = totalRooms - occupiedRooms;

    const insights: Insight[] = [];

    // Insight 1: Collection efficiency
    if (expectedIncome > 0) {
        const isGood = collectionRate >= 80;
        insights.push({
            icon: <DollarSign className="h-4 w-4" />,
            title: "Hiệu suất thu tiền",
            value: `${collectionRate.toFixed(0)}%`,
            description: isGood
                ? `Đã thu ${formatCurrency(collected)} / ${formatCurrency(expectedIncome)}`
                : `Còn thiếu ${formatCurrency(expectedIncome - collected)}`,
            trend: isGood ? "up" : "warning",
            color: isGood ? "emerald" : "amber",
        });
    }

    // Insight 2: Occupancy
    if (totalRooms > 0) {
        const isHealthy = occupancyRate >= 70;
        insights.push({
            icon: <Home className="h-4 w-4" />,
            title: "Tỷ lệ lấp đầy",
            value: `${occupancyRate.toFixed(0)}%`,
            description: isHealthy
                ? `${occupiedRooms}/${totalRooms} phòng đang cho thuê`
                : `${vacantRooms} phòng trống cần tìm khách`,
            trend: isHealthy ? "up" : "down",
            color: isHealthy ? "blue" : "orange",
        });
    }

    // Insight 3: Revenue forecast or overdue warning
    if (overdueBills > 0) {
        insights.push({
            icon: <AlertTriangle className="h-4 w-4" />,
            title: "Cảnh báo nợ xấu",
            value: `${overdueBills} hóa đơn`,
            description: `${pendingBills} đơn chờ + ${overdueBills} quá hạn cần xử lý`,
            trend: "warning",
            color: "red",
        });
    } else if (totalRooms > 0) {
        const nextMonthForecast = occupiedRooms * (expectedIncome / Math.max(occupiedRooms, 1));
        insights.push({
            icon: <BarChart3 className="h-4 w-4" />,
            title: "Dự báo tháng tới",
            value: formatCurrency(nextMonthForecast),
            description: occupancyRate >= 90
                ? "Ổn định, phòng gần lấp đầy"
                : `Có thể tăng nếu lấp ${vacantRooms} phòng trống`,
            trend: occupancyRate >= 90 ? "up" : "neutral",
            color: "violet",
        });
    }

    if (insights.length === 0) return null;

    const trendIcons = {
        up: <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />,
        down: <TrendingDown className="h-3.5 w-3.5 text-red-500" />,
        warning: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
        neutral: <ArrowUpRight className="h-3.5 w-3.5 text-blue-500" />,
    };

    const colorMap: Record<string, string> = {
        emerald: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20",
        blue: "from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20",
        amber: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20",
        orange: "from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20",
        red: "from-red-500/10 to-pink-500/10 dark:from-red-500/20 dark:to-pink-500/20",
        violet: "from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20",
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className="p-1 rounded-md bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
                        <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    AI Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
                {insights.map((insight, i) => (
                    <div
                        key={i}
                        className={`rounded-xl p-3 bg-gradient-to-r ${colorMap[insight.color] || colorMap.blue}`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{insight.icon}</span>
                                <span className="text-xs font-medium text-muted-foreground">{insight.title}</span>
                            </div>
                            {trendIcons[insight.trend]}
                        </div>
                        <div className="text-lg font-bold tracking-tight">{insight.value}</div>
                        <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
