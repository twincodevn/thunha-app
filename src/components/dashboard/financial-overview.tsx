"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/billing";
import { getFinancialSummary, FinancialSummary } from "@/app/actions/finance-actions";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Wallet, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";

export function FinancialOverview() {
    const [data, setData] = useState<FinancialSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState("6"); // months

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const result = await getFinancialSummary(parseInt(timeRange));
                if ("error" in result) {
                    setError(result.error);
                } else {
                    setData(result);
                }
            } catch (err) {
                setError("Failed to load financial data");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [timeRange]);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4 text-center text-red-500">
                Error: {error || "No data available"}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Tổng quan tài chính</h2>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Chọn thời gian" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="3">3 tháng gần nhất</SelectItem>
                        <SelectItem value="6">6 tháng gần nhất</SelectItem>
                        <SelectItem value="12">1 năm qua</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Doanh thu tháng này</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            {data.revenueGrowth > 0 ? (
                                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                            ) : (
                                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                            )}
                            <span className={data.revenueGrowth > 0 ? "text-green-500" : "text-red-500"}>
                                {Math.abs(data.revenueGrowth).toFixed(1)}%
                            </span>
                            &nbsp;so với tháng trước
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Chi phí tháng này</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.totalExpenses)}</div>
                        <p className="text-xs text-muted-foreground flex items-center mt-1">
                            {data.expenseGrowth > 0 ? (
                                <TrendingUp className="mr-1 h-3 w-3 text-red-500" />
                            ) : (
                                <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
                            )}
                            <span className={data.expenseGrowth > 0 ? "text-red-500" : "text-green-500"}>
                                {Math.abs(data.expenseGrowth).toFixed(1)}%
                            </span>
                            &nbsp;so với tháng trước
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lợi nhuận ròng (NOI)</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(data.noi)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {((data.noi / (data.totalRevenue || 1)) * 100).toFixed(1)}% Doanh thu
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Biểu đồ Doanh thu & Chi phí</CardTitle>
                        <CardDescription>
                            So sánh dòng tiền trong {timeRange} tháng qua
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value / 1000000}M`}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => formatCurrency(Number(value) || 0)}
                                        labelStyle={{ color: "black" }}
                                    />
                                    <Legend />
                                    <Bar dataKey="revenue" name="Doanh thu" fill="url(#colorRevenue)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expenses" name="Chi phí" fill="url(#colorExpenses)" radius={[4, 4, 0, 0]} />
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                        </linearGradient>
                                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Lợi nhuận theo tháng</CardTitle>
                        <CardDescription>
                            Net Operating Income (NOI)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value / 1000000}M`}
                                    />
                                    <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} />
                                    <Area
                                        type="monotone"
                                        dataKey="noi"
                                        name="Lợi nhuận"
                                        stroke="#3b82f6"
                                        fill="#3b82f6"
                                        fillOpacity={0.2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
