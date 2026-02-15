"use client";

import { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Loader2, Building2, TrendingUp, Users, AlertTriangle, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getPropertyComparison } from "./actions";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

export default function ComparisonPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [sortBy, setSortBy] = useState<string>("revenue");

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const result = await getPropertyComparison(parseInt(year));
                setData(result);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [year]);

    const sortedData = [...data].sort((a, b) => {
        if (sortBy === "revenue") return b.revenue - a.revenue;
        if (sortBy === "occupancy") return b.occupancyRate - a.occupancyRate;
        if (sortBy === "profit") return b.netProfit - a.netProfit;
        return 0;
    });

    // Prepare chart data — monthly revenue by property
    const chartData = Array.from({ length: 12 }, (_, i) => {
        const entry: any = { name: `T${i + 1}` };
        data.forEach((prop) => {
            entry[prop.name] = prop.monthlyRevenue[i];
        });
        return entry;
    });

    const currentYear = new Date().getFullYear();

    if (loading) {
        return (
            <DashboardShell>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell>
            <PageHeader
                title="So sánh tòa nhà"
                description="Đánh giá hiệu suất từng tòa nhà một cách trực quan"
            >
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-28">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: 3 }, (_, i) => currentYear - i).map((y) => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </PageHeader>

            {data.length < 2 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                            Cần ít nhất 2 tòa nhà để so sánh. Hiện bạn có {data.length} tòa nhà.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {sortedData.map((prop, idx) => (
                            <Card key={prop.id} className="relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                        {prop.name}
                                    </CardTitle>
                                    <CardDescription className="text-xs truncate">{prop.address}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" /> Doanh thu
                                        </span>
                                        <span className="text-sm font-bold text-emerald-600">{formatCurrency(prop.revenue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Users className="h-3 w-3" /> Lấp đầy
                                        </span>
                                        <Badge variant={prop.occupancyRate >= 80 ? "default" : prop.occupancyRate >= 50 ? "secondary" : "destructive"}>
                                            {prop.occupancyRate}% ({prop.occupiedRooms}/{prop.totalRooms})
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Nợ
                                        </span>
                                        <span className={`text-sm font-medium ${prop.outstanding > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                                            {prop.outstanding > 0 ? formatCurrency(prop.outstanding) : "—"}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Monthly Revenue Chart */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-base">Doanh thu hàng tháng</CardTitle>
                            <CardDescription>So sánh doanh thu từng tòa nhà theo tháng</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" className="text-xs" />
                                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} className="text-xs" />
                                    <Tooltip
                                        formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                                        contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                                    />
                                    <Legend />
                                    {data.map((prop, idx) => (
                                        <Bar key={prop.id} dataKey={prop.name} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Ranking Table */}
                    <Card className="mt-6">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base">Bảng xếp hạng</CardTitle>
                                <CardDescription>Sắp xếp theo chỉ số hiệu suất</CardDescription>
                            </div>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-36">
                                    <ArrowUpDown className="mr-2 h-3 w-3" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="revenue">Doanh thu</SelectItem>
                                    <SelectItem value="occupancy">Lấp đầy</SelectItem>
                                    <SelectItem value="profit">Lợi nhuận</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-8">#</TableHead>
                                        <TableHead>Tòa nhà</TableHead>
                                        <TableHead className="text-right">Doanh thu</TableHead>
                                        <TableHead className="text-right">Chi phí</TableHead>
                                        <TableHead className="text-right">Lợi nhuận</TableHead>
                                        <TableHead className="text-center">Lấp đầy</TableHead>
                                        <TableHead className="text-right">Nợ quá hạn</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedData.map((prop, idx) => (
                                        <TableRow key={prop.id}>
                                            <TableCell className="font-bold">{idx + 1}</TableCell>
                                            <TableCell className="font-medium">{prop.name}</TableCell>
                                            <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(prop.revenue)}</TableCell>
                                            <TableCell className="text-right text-red-500">{formatCurrency(prop.expenses)}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(prop.netProfit)}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={prop.occupancyRate >= 80 ? "default" : "secondary"}>
                                                    {prop.occupancyRate}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {prop.overdueBills > 0 ? (
                                                    <Badge variant="destructive">{prop.overdueBills}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </DashboardShell>
    );
}
