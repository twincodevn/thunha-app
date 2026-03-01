
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Plus, ArrowLeft, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { getBillableTenants, createBills } from "../actions";

interface BillableItem {
    status: "PENDING" | "GENERATED";
    roomTenantId?: string;
    roomId?: string;
    roomNumber: string;
    tenantName: string;

    billId?: string;

    baseRent?: number;

    meterReadingId?: string;
    hasReading?: boolean;

    electricityUsage?: number;
    electricityRate?: number;
    electricityAmount?: number;

    waterUsage?: number;
    waterRate?: number;
    waterAmount?: number;

    services?: { name: string; price: number }[];
    servicesTotal?: number;

    total: number;
}

export default function GenerateBillPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
    const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));
    const [dueDate, setDueDate] = useState<string>(
        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString().split('T')[0]
    );

    const [items, setItems] = useState<BillableItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]); // roomTenantIds

    // Fetch properties
    useEffect(() => {
        async function fetchProperties() {
            try {
                const res = await fetch("/api/properties");
                if (res.ok) {
                    const data = await res.json();
                    setProperties(data);
                    if (data.length > 0) setSelectedPropertyId(data[0].id);
                }
            } catch (error) {
                console.error("Failed to fetch properties", error);
            }
        }
        fetchProperties();
    }, []);

    // Fetch billable items
    useEffect(() => {
        if (!selectedPropertyId) return;

        async function fetchData() {
            setIsLoading(true);
            try {
                const result = await getBillableTenants(
                    selectedPropertyId,
                    parseInt(month),
                    parseInt(year)
                );

                if (result.success && result.items) {
                    setItems(result.items as BillableItem[]);
                    // Select all PENDING items by default
                    setSelectedItems(
                        result.items
                            .filter(i => i.status === "PENDING" && i.hasReading)
                            .map(i => i.roomTenantId!)
                    );
                }
            } catch (error) {
                console.error("Failed to fetch billable items", error);
                toast.error("Không thể tải danh sách cần thanh toán");
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [selectedPropertyId, month, year]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedItems(items.filter(i => i.status === "PENDING" && i.hasReading).map(i => i.roomTenantId!));
        } else {
            setSelectedItems([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedItems([...selectedItems, id]);
        } else {
            setSelectedItems(selectedItems.filter(itemId => itemId !== id));
        }
    };

    const handleGenerate = async () => {
        if (selectedItems.length === 0) return;

        setIsGenerating(true);
        try {
            const billsToCreate = items
                .filter(item => selectedItems.includes(item.roomTenantId!))
                .map(item => ({
                    roomTenantId: item.roomTenantId!,
                    month: parseInt(month),
                    year: parseInt(year),
                    meterReadingId: item.meterReadingId,
                    baseRent: item.baseRent!,
                    electricityAmount: item.electricityAmount!,
                    electricityUsage: item.electricityUsage!,
                    waterAmount: item.waterAmount!,
                    waterUsage: item.waterUsage!,
                    services: item.services || [],
                    total: item.total,
                    dueDate: dueDate,
                }));

            const result = await createBills(billsToCreate);

            if (result.success) {
                toast.success(`Đã tạo thành công ${result.count} hóa đơn`);
                router.push("/dashboard/billing");
            } else {
                toast.error(result.error || "Có lỗi xảy ra");
            }
        } catch (error) {
            toast.error("Đã xảy ra lỗi");
        } finally {
            setIsGenerating(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/billing">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Lập hóa đơn</h1>
                    <p className="text-muted-foreground">Tạo hóa đơn hàng tháng cho khách thuê</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-4 items-end">
                        <div className="space-y-2">
                            <Label>Tòa nhà</Label>
                            <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn tòa nhà" />
                                </SelectTrigger>
                                <SelectContent>
                                    {properties.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tháng</Label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                        <SelectItem key={m} value={String(m)}>
                                            Tháng {m}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Năm</Label>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {["2024", "2025", "2026"].map((y) => (
                                        <SelectItem key={y} value={y}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Hạn thanh toán</Label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Danh sách phòng cần thanh toán</CardTitle>
                        <CardDescription>
                            Chon các phòng để tạo hóa đơn
                        </CardDescription>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={selectedItems.length === 0 || isGenerating}
                    >
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo {selectedItems.length} hóa đơn
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-6">
                            <EmptyState
                                icon={FileText}
                                title="Tuyệt vời, không có hóa đơn nào trống!"
                                description="Tất cả các phòng trong tòa nhà này đều đã được lập hóa đơn hoặc chưa tới kỳ hạn."
                            />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={
                                                    items.filter(i => i.status === "PENDING" && i.hasReading).length > 0 &&
                                                    selectedItems.length === items.filter(i => i.status === "PENDING" && i.hasReading).length
                                                }
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead>Phòng</TableHead>
                                        <TableHead>Khách thuê</TableHead>
                                        <TableHead className="text-right">Tiền phòng</TableHead>
                                        <TableHead className="text-right">Điện</TableHead>
                                        <TableHead className="text-right">Nước</TableHead>
                                        <TableHead className="text-right">Dịch vụ</TableHead>
                                        <TableHead className="text-right">Tổng cộng</TableHead>
                                        <TableHead className="text-center">Trạng thái</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.roomNumber}>
                                            <TableCell>
                                                {item.status === "PENDING" && (
                                                    <Checkbox
                                                        checked={selectedItems.includes(item.roomTenantId!)}
                                                        onCheckedChange={(c: any) => handleSelectOne(item.roomTenantId!, c)}
                                                        disabled={!item.hasReading}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{item.roomNumber}</TableCell>
                                            <TableCell>{item.tenantName}</TableCell>

                                            {item.status === "GENERATED" ? (
                                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                    Đã tạo hóa đơn ({formatCurrency(item.total)})
                                                </TableCell>
                                            ) : (
                                                <>
                                                    <TableCell className="text-right">{formatCurrency(item.baseRent || 0)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span>{formatCurrency(item.electricityAmount || 0)}</span>
                                                            <span className="text-xs text-muted-foreground">{item.electricityUsage} số</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span>{formatCurrency(item.waterAmount || 0)}</span>
                                                            <span className="text-xs text-muted-foreground">{item.waterUsage} khối</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.servicesTotal || 0)}</TableCell>
                                                    <TableCell className="text-right font-bold text-green-600">
                                                        {formatCurrency(item.total)}
                                                    </TableCell>
                                                </>
                                            )}

                                            <TableCell className="text-center">
                                                {item.status === "GENERATED" ? (
                                                    <Badge variant="secondary" className="flex w-fit mx-auto gap-1">
                                                        <CheckCircle className="h-3 w-3" /> Đã tạo
                                                    </Badge>
                                                ) : !item.hasReading ? (
                                                    <Badge variant="outline" className="flex w-fit mx-auto gap-1 text-orange-500 border-orange-500">
                                                        <AlertCircle className="h-3 w-3" /> Thiếu chỉ số
                                                    </Badge>
                                                ) : (
                                                    <Badge className="flex w-fit mx-auto bg-blue-500 hover:bg-blue-600">
                                                        Sẵn sàng
                                                    </Badge>
                                                )}
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
