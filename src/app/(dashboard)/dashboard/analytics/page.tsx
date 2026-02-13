
"use client";

import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import {
    Loader2,
    DollarSign,
    Users,
    Home,
    AlertCircle,
    TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getDashboardStats, getRevenueChartData, getOccupancyStats } from "./actions";

export default function AnalyticsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [occupancyData, setOccupancyData] = useState<any[]>([]);

    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("ALL");
    const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));

    // Fetch properties
    useEffect(() => {
        async function fetchProperties() {
            try {
                const res = await fetch("/api/properties");
                if (res.ok) {
                    const data = await res.json();
                    setProperties(data);
                }
            } catch (error) {
                console.error("Failed to fetch properties", error);
            }
        }
        fetchProperties();
    }, []);

    // Fetch analytics data
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const propertyId = selectedPropertyId === "ALL" ? undefined : selectedPropertyId;
                const [statsResult, revenueResult, occupancyResult] = await Promise.all([
                    getDashboardStats(propertyId, undefined, parseInt(year)),
                    getRevenueChartData(propertyId, parseInt(year)),
                    getOccupancyStats(propertyId)
                ]);

                setStats(statsResult);
                setRevenueData(revenueResult);
                setOccupancyData(occupancyResult);
            } catch (error) {
                console.error("Failed to fetch analytics", error);
                toast.error("Không thể tải dữ liệu phân tích");
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [selectedPropertyId, year]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Thống kê & Phân tích</h1>
                    <p className="text-muted-foreground">Tổng quan hiệu quả kinh doanh của bạn</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Tất cả tòa nhà" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả tòa nhà</SelectItem>
                            {properties.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {["2024", "2025", "2026"].map((y) => (
                                <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doanh thu tháng này</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.revenue || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Đã thanh toán trong tháng {new Date().getMonth() + 1}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tỷ lệ lấp đầy</CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.occupancyRate || 0}%</div>
                        <p className="text-xs text-muted-foreground">
                            {stats?.occupiedRooms || 0}/{stats?.totalRooms || 0} phòng đang thuê
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Khách thuê</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.activeTenants || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Đang hoạt động
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cần thu</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(stats?.outstanding || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Chờ thanh toán & Quá hạn
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Biểu Đồ Doanh Thu</CardTitle>
                        <CardDescription>
                            Doanh thu theo tháng trong năm {year}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value / 1000000}M`}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => formatCurrency(value)}
                                        labelStyle={{ color: "black" }}
                                    />
                                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Doanh thu" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Occupancy Pie Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Trạng Thái Phòng</CardTitle>
                        <CardDescription>
                            Phân bố trạng thái phòng hiện tại
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={occupancyData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {occupancyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
