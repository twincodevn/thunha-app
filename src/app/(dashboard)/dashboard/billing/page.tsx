
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Search, Filter, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBills } from "./actions";

// Enum mapping for display
const statusMap: Record<string, { label: string; color: string }> = {
    DRAFT: { label: "Nháp", color: "bg-gray-500" },
    PENDING: { label: "Chờ thanh toán", color: "bg-yellow-500" },
    PAID: { label: "Đã thanh toán", color: "bg-green-500" },
    OVERDUE: { label: "Quá hạn", color: "bg-red-500" },
    CANCELLED: { label: "Đã hủy", color: "bg-gray-400" },
};

export default function BillingPage() {
    const [bills, setBills] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));
    const [status, setStatus] = useState<string>("ALL");

    useEffect(() => {
        async function fetchBills() {
            setIsLoading(true);
            try {
                const data = await getBills(undefined, parseInt(month), parseInt(year), status);
                setBills(data);
            } catch (error) {
                console.error("Failed to fetch bills", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchBills();
    }, [month, year, status]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý hóa đơn</h1>
                    <p className="text-muted-foreground">Theo dõi và quản lý hóa đơn tiền nhà hàng tháng</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/billing/generate">
                        <Plus className="mr-2 h-4 w-4" />
                        Lập hóa đơn mới
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-2">
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Tháng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                        <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Năm" />
                                </SelectTrigger>
                                <SelectContent>
                                    {["2024", "2025", "2026"].map((y) => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    {Object.entries(statusMap).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>{value.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : bills.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Chưa có hóa đơn nào cho tháng này.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã HĐ</TableHead>
                                        <TableHead>Phòng</TableHead>
                                        <TableHead>Khách thuê</TableHead>
                                        <TableHead className="text-right">Tổng tiền</TableHead>
                                        <TableHead>Hạn thanh toán</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead className="text-right">Thao tác</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bills.map((bill) => (
                                        <TableRow key={bill.id}>
                                            <TableCell className="font-medium">#{bill.id.slice(-6).toUpperCase()}</TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{bill.roomTenant.room.roomNumber}</div>
                                                    <div className="text-xs text-muted-foreground">{bill.roomTenant.room.property.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{bill.roomTenant.tenant.name}</TableCell>
                                            <TableCell className="text-right font-bold">
                                                {formatCurrency(bill.total)}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(bill.dueDate), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${statusMap[bill.status]?.color || "bg-gray-500"} hover:${statusMap[bill.status]?.color}`}>
                                                    {statusMap[bill.status]?.label || bill.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/dashboard/billing/${bill.id}`}>
                                                        <FileText className="h-4 w-4 mr-1" />
                                                        Chi tiết
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
