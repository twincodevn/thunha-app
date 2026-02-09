"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Home, DollarSign, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Legend
} from "recharts";

interface AnalyticsData {
    period: string;
    revenue: {
        total: number;
        byDay: { date: string; amount: number }[];
        byMethod: Record<string, number>;
    };
    bills: {
        stats: { status: string; count: number; total: number }[];
        collectionRate: number;
    };
    rooms: {
        total: number;
        occupied: number;
        vacant: number;
        maintenance: number;
        occupancyRate: number;
    };
    tenants: {
        total: number;
        active: number;
    };
}

async function fetchAnalytics(period: string): Promise<AnalyticsData> {
    const res = await fetch(`/api/reports/analytics?period=${period}`);
    if (!res.ok) {
        throw new Error("Failed to fetch analytics");
    }
    return res.json();
}

export default function AnalyticsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["analytics", "month"],
        queryFn: () => fetchAnalytics("month"),
        retry: false,
    });

    // Check if user doesn't have access (403)
    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Phân tích doanh thu</h1>
                    <p className="text-muted-foreground">Báo cáo chi tiết về hoạt động kinh doanh</p>
                </div>

                <Card className="border-2 border-dashed bg-muted/50">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-6">
                            <Lock className="h-8 w-8 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Tính năng Business</h3>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                            Phân tích nâng cao chỉ có trong gói Business. Nâng cấp để xem báo cáo doanh thu,
                            tỷ lệ thu tiền, và xu hướng kinh doanh.
                        </p>
                        <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600">
                            <Link href="/dashboard/settings/billing">Nâng cấp lên Business</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Phân tích doanh thu</h1>
                    <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="h-20 bg-muted animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Phân tích doanh thu</h1>
                    <p className="text-muted-foreground">Báo cáo chi tiết về hoạt động kinh doanh</p>
                </div>
                <Tabs defaultValue="month" className="w-[300px]">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="month">Tháng</TabsTrigger>
                        <TabsTrigger value="quarter">Quý</TabsTrigger>
                        <TabsTrigger value="year">Năm</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(data.revenue.total)}
                        </div>
                        <p className="text-xs text-muted-foreground">Thống kê tháng này</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tỷ lệ thu tiền</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.bills.collectionRate}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${data.bills.collectionRate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tỷ lệ lấp đầy</CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.rooms.occupancyRate}%</div>
                        <p className="text-xs text-muted-foreground">
                            {data.rooms.occupied}/{data.rooms.total} phòng đang thuê
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Khách thuê</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.tenants.active}</div>
                        <p className="text-xs text-muted-foreground">
                            Đang thuê / {data.tenants.total} tổng số
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue by Day - Area Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Doanh thu theo thời gian</CardTitle>
                        <CardDescription>Biến động doanh thu trong kỳ</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.revenue.byDay}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(date: string) => new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tickFormatter={(value: number) => `${value / 1000000}M`}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickCount={5}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <Tooltip
                                        formatter={(value: number | undefined) => formatCurrency(value || 0)}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        labelFormatter={(label: any) => new Date(label).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
                                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#2563eb"
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue by Method - Bar Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Phương thức thanh toán</CardTitle>
                        <CardDescription>Tỷ lệ theo phương thức</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={Object.entries(data.revenue.byMethod).map(([name, value]) => ({
                                    name: name === "CASH" ? "Tiền mặt" : name === "BANK_TRANSFER" ? "Chuyển khoản" : name,
                                    value
                                }))}>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        tickLine={false}
                                        axisLine={false}
                                        fontSize={12}
                                    />
                                    <Tooltip
                                        formatter={(value: number | undefined) => formatCurrency(value || 0)}
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: "8px" }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32}>
                                        {Object.entries(data.revenue.byMethod).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={["#22c55e", "#3b82f6", "#ef4444", "#ec4899"][index % 4]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Room Status - Pie Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Tình trạng phòng</CardTitle>
                        <CardDescription>Phân bổ trạng thái phòng</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: "Đang thuê", value: data.rooms.occupied, color: "#22c55e" },
                                            { name: "Trống", value: data.rooms.vacant, color: "#9ca3af" },
                                            { name: "Bảo trì", value: data.rooms.maintenance, color: "#f97316" },
                                        ].filter(i => i.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {/* Cells handled by data color */}
                                        {[
                                            { name: "Đang thuê", value: data.rooms.occupied, color: "#22c55e" },
                                            { name: "Trống", value: data.rooms.vacant, color: "#9ca3af" },
                                            { name: "Bảo trì", value: data.rooms.maintenance, color: "#f97316" },
                                        ].filter(i => i.value > 0).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Bill Status - Bar Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Trạng thái hóa đơn</CardTitle>
                        <CardDescription>Số lượng hóa đơn theo trạng thái</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.bills.stats.map(s => ({
                                    ...s,
                                    name: s.status === "PAID" ? "Đã thanh toán" : s.status === "PENDING" ? "Chờ thanh toán" : s.status === "DRAFT" ? "Nháp" : s.status
                                }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" name="Số lượng" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={40}>
                                        {data.bills.stats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={
                                                entry.status === "PAID" ? "#22c55e" :
                                                    entry.status === "PENDING" ? "#f97316" :
                                                        entry.status === "OVERDUE" ? "#ef4444" : "#94a3b8"
                                            } />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
