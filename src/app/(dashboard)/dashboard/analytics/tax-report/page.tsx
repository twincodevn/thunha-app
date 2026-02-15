"use client";

import { useState, useEffect } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Loader2, Download, TrendingUp, TrendingDown, Wallet, Receipt, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { toast } from "sonner";
import { getTaxReport, exportTaxCSV } from "./actions";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

export default function TaxReportPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const result = await getTaxReport(parseInt(year));
                setData(result);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [year]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const csv = await exportTaxCSV(parseInt(year));
            const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `bao-cao-thue-${year}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Đã tải báo cáo thuế!");
        } catch (error) {
            toast.error("Lỗi xuất báo cáo");
        } finally {
            setExporting(false);
        }
    };

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

    const s = data?.summary;

    return (
        <DashboardShell>
            <PageHeader
                title="Báo cáo thuế"
                description={`Tổng hợp thu nhập và chi phí cho khai thuế ${year}`}
            >
                <div className="flex gap-2">
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
                    <Button variant="outline" onClick={handleExport} disabled={exporting}>
                        {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Xuất CSV
                    </Button>
                </div>
            </PageHeader>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Tổng thu nhập
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(s?.totalIncome || 0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Tiền phòng: {formatCurrency(s?.totalRentIncome || 0)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" /> Tổng chi phí
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-500">{formatCurrency(s?.totalExpense || 0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Sửa chữa, bảo trì</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Wallet className="h-3 w-3" /> Lợi nhuận ròng
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-2xl font-bold ${(s?.netProfit || 0) >= 0 ? "text-blue-600" : "text-red-500"}`}>
                            {formatCurrency(s?.netProfit || 0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Thu nhập - Chi phí</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Calculator className="h-3 w-3" /> Thuế ước tính
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-amber-600">{formatCurrency(s?.estimatedTax || 0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            VAT 5% + TNCN 5% = {s?.taxRate || 10}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Monthly Revenue vs Expense Chart */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base">Thu nhập & Chi phí theo tháng</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={data?.monthlyData || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="monthName" className="text-xs" />
                            <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`} className="text-xs" />
                            <Tooltip formatter={(v: number | undefined) => formatCurrency(v ?? 0)} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                            <Legend />
                            <Bar dataKey="totalIncome" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="totalExpense" name="Chi phí" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Monthly Detail Table */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Receipt className="h-4 w-4" /> Chi tiết từng tháng
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tháng</TableHead>
                                <TableHead className="text-right">Tiền phòng</TableHead>
                                <TableHead className="text-right">Điện nước</TableHead>
                                <TableHead className="text-right">Dịch vụ</TableHead>
                                <TableHead className="text-right font-bold">Tổng thu</TableHead>
                                <TableHead className="text-right">Chi phí</TableHead>
                                <TableHead className="text-right font-bold">Lợi nhuận</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(data?.monthlyData || []).map((m: any) => (
                                <TableRow key={m.month}>
                                    <TableCell className="font-medium">{m.monthName}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(m.rentIncome)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(m.utilityIncome)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(m.serviceIncome)}</TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(m.totalIncome)}</TableCell>
                                    <TableCell className="text-right text-red-500">{formatCurrency(m.totalExpense)}</TableCell>
                                    <TableCell className={`text-right font-bold ${m.netProfit >= 0 ? "text-blue-600" : "text-red-500"}`}>
                                        {formatCurrency(m.netProfit)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {/* Total row */}
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell>TỔNG NĂM</TableCell>
                                <TableCell className="text-right">{formatCurrency(s?.totalRentIncome || 0)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(s?.totalUtilityIncome || 0)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(s?.totalServiceIncome || 0)}</TableCell>
                                <TableCell className="text-right text-emerald-600">{formatCurrency(s?.totalIncome || 0)}</TableCell>
                                <TableCell className="text-right text-red-500">{formatCurrency(s?.totalExpense || 0)}</TableCell>
                                <TableCell className="text-right text-blue-600">{formatCurrency(s?.netProfit || 0)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Tax Info */}
            <Card className="mt-6 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                        <Calculator className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-sm">
                            <p className="font-medium text-amber-800 dark:text-amber-400">Thông tin thuế cho thuê nhà</p>
                            <ul className="mt-1 text-amber-700 dark:text-amber-500 space-y-0.5 text-xs">
                                <li>• Thuế VAT: 5% trên tổng thu nhập cho thuê</li>
                                <li>• Thuế TNCN: 5% trên tổng thu nhập cho thuê</li>
                                <li>• Miễn thuế nếu doanh thu dưới 100 triệu/năm</li>
                                <li>• Đây là ước tính, vui lòng tham khảo kế toán chuyên nghiệp</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </DashboardShell>
    );
}
