"use client";

import { useState, useEffect } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend,
} from "recharts";
import {
    Loader2, TrendingUp, TrendingDown, Brain, Lightbulb, AlertTriangle,
    CheckCircle, Info, Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAIForecast } from "./actions";

function fmt(amount: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

const insightIcons = {
    positive: CheckCircle,
    warning: AlertTriangle,
    info: Info,
};

const insightColors = {
    positive: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
    warning: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    info: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
};

export default function ForecastPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAIForecast()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <DashboardShell>
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <Brain className="h-8 w-8 animate-pulse text-purple-500" />
                    <p className="text-muted-foreground">AI đang phân tích dữ liệu...</p>
                </div>
            </DashboardShell>
        );
    }

    // Combine historical + forecast for chart
    const chartData = [
        ...(data?.historical || []).map((h: any) => ({
            name: h.label,
            actual: h.value,
            type: "historical",
        })),
        ...(data?.forecast || []).map((f: any) => ({
            name: f.label,
            projected: f.projected,
            adjusted: f.adjusted,
            confidence: f.confidence,
            type: "forecast",
        })),
    ];

    const c = data?.current;
    const trendUp = (c?.trendPercent || 0) >= 0;

    return (
        <DashboardShell>
            <PageHeader
                title="Dự báo AI"
                description="Phân tích xu hướng và dự đoán doanh thu thông minh"
            >
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 gap-1">
                    <Brain className="h-3 w-3" /> AI Powered
                </Badge>
            </PageHeader>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Doanh thu TB/tháng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{fmt(c?.avgMonthlyRevenue || 0)}</p>
                        <div className={`flex items-center gap-1 mt-1 text-sm ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
                            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(c?.trendPercent || 0).toFixed(1)}%/tháng
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-teal-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Tỷ lệ lấp đầy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{c?.occupancyRate || 0}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {c?.occupiedRooms}/{c?.totalRooms} phòng
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Dự báo tháng tới</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{fmt(data?.forecast?.[0]?.adjusted || 0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Độ tin cậy: {data?.forecast?.[0]?.confidence || 0}%
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Dự báo 6 tháng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            {fmt((data?.forecast || []).reduce((s: number, f: any) => s + f.adjusted, 0))}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Tổng 6 tháng tiếp theo</p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Forecast Chart */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-500" />
                        Biểu đồ dự báo doanh thu
                    </CardTitle>
                    <CardDescription>Lịch sử (xanh) → Dự báo (tím, có điều chỉnh rủi ro)</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} className="text-xs" />
                            <Tooltip formatter={(v: number | undefined) => fmt(v ?? 0)} />
                            <Legend />
                            <Area
                                type="monotone" dataKey="actual" name="Doanh thu thực"
                                stroke="#10b981" fill="url(#colorActual)" strokeWidth={2}
                            />
                            <Area
                                type="monotone" dataKey="adjusted" name="Dự báo (điều chỉnh)"
                                stroke="#8b5cf6" fill="url(#colorProjected)" strokeWidth={2} strokeDasharray="5 5"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Nhận định AI
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {(data?.insights || []).map((insight: any, idx: number) => {
                        const Icon = insightIcons[insight.type as keyof typeof insightIcons];
                        const colorClass = insightColors[insight.type as keyof typeof insightColors];
                        return (
                            <div key={idx} className={`flex items-start gap-3 rounded-lg border p-3 ${colorClass}`}>
                                <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                                <p className="text-sm">{insight.message}</p>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Forecast Detail Table */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base">Chi tiết dự báo 6 tháng</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {(data?.forecast || []).map((f: any) => (
                            <div key={f.label} className="bg-muted/30 rounded-lg p-3 text-center">
                                <p className="text-xs text-muted-foreground font-medium">{f.label}</p>
                                <p className="text-lg font-bold mt-1">{fmt(f.adjusted)}</p>
                                <Badge variant="outline" className="mt-1 text-xs">
                                    {f.confidence}% tin cậy
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </DashboardShell>
    );
}
