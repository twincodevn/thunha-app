"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/billing";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, AlertCircle } from "lucide-react";

interface ReportsData {
    currentYear: number;
    monthlyData: { month: number; paid: number; unpaid: number; expected: number }[];
    propertyData: { id: string; name: string; paid: number; unpaid: number; expected: number }[];
}

export function ReportsClient({ initialData }: { initialData: ReportsData }) {
    const [year, setYear] = useState(initialData.currentYear.toString());

    // Calculate Totals
    const totalExpected = initialData.monthlyData.reduce((sum, d) => sum + d.expected, 0);
    const totalPaid = initialData.monthlyData.reduce((sum, d) => sum + d.paid, 0);
    const totalUnpaid = initialData.monthlyData.reduce((sum, d) => sum + d.unpaid, 0);

    const collectionRate = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

    return (
        <DashboardShell>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <PageHeader
                    title="Báo cáo Tài chính"
                    description="Tổng quan doanh thu và công nợ theo thời gian thực"
                />

                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-[120px] bg-white">
                        <SelectValue placeholder="Năm" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={(initialData.currentYear - 1).toString()}>{initialData.currentYear - 1}</SelectItem>
                        <SelectItem value={initialData.currentYear.toString()}>{initialData.currentYear}</SelectItem>
                        <SelectItem value={(initialData.currentYear + 1).toString()}>{initialData.currentYear + 1}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tổng thực thu ({year})</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Đã thanh toán thành công</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tổng công nợ ({year})</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(totalUnpaid)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Hóa đơn chờ hoặc quá hạn</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tỷ lệ thu hồi ({year})</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{collectionRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Trên tổng 100% doanh thu dự kiến</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Monthly Chart */}
                <Card className="col-span-2 lg:col-span-1 border-slate-200">
                    <CardHeader>
                        <CardTitle>Doanh thu hàng tháng</CardTitle>
                        <CardDescription>Biểu đồ thực thu vs công nợ năm {year}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={initialData.monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="month"
                                    tickFormatter={(val) => `Th${val}`}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    tickFormatter={(val) => `${val / 1000000}M`}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                />
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(Number(value))}
                                    labelFormatter={(label) => `Tháng ${label}`}
                                    cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                <Bar dataKey="paid" name="Thực thu" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={24} />
                                <Bar dataKey="unpaid" name="Công nợ" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Property Chart */}
                <Card className="col-span-2 lg:col-span-1 border-slate-200">
                    <CardHeader>
                        <CardTitle>Hiệu quả theo Tòa nhà</CardTitle>
                        <CardDescription>Đánh giá tỷ lệ thu tiền từng khu vực</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={initialData.propertyData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis
                                    type="number"
                                    tickFormatter={(val) => `${val / 1000000}M`}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                    width={100}
                                />
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(Number(value))}
                                    cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                <Bar dataKey="paid" name="Thực thu" fill="#16a34a" radius={[0, 4, 4, 0]} stackId="a" />
                                <Bar dataKey="unpaid" name="Công nợ" fill="#ef4444" radius={[0, 4, 4, 0]} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    );
}
