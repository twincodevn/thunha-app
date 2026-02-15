"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Loader2, PiggyBank, Plus, ArrowDownCircle, ArrowUpCircle, MinusCircle,
    ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { toast } from "sonner";
import { getDeposits, recordDeposit } from "./actions";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
}

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
    RECEIVED: { label: "Nhận cọc", icon: ArrowDownCircle, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30" },
    RETURNED: { label: "Trả cọc", icon: ArrowUpCircle, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30" },
    DEDUCTED: { label: "Khấu trừ", icon: MinusCircle, color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
};

export default function DepositsPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTenantId, setSelectedTenantId] = useState("");
    const [depositType, setDepositType] = useState<"RECEIVED" | "RETURNED" | "DEDUCTED">("RECEIVED");
    const [depositAmount, setDepositAmount] = useState("");
    const [depositReason, setDepositReason] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await getDeposits();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = () => {
        if (!selectedTenantId || !depositAmount) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return;
        }

        startTransition(async () => {
            const result = await recordDeposit({
                roomTenantId: selectedTenantId,
                amount: parseFloat(depositAmount),
                type: depositType,
                reason: depositReason || undefined,
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Đã ghi nhận tiền cọc!");
                setDialogOpen(false);
                setDepositAmount("");
                setDepositReason("");
                fetchData();
            }
        });
    };

    const totalHeld = data.reduce((sum, d) => sum + d.balance, 0);
    const totalReceived = data.reduce((sum, d) => sum + d.received, 0);
    const totalReturned = data.reduce((sum, d) => sum + d.returned + d.deducted, 0);

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
                title="Quản lý tiền cọc"
                description="Theo dõi tiền cọc nhận, trả, khấu trừ cho từng khách thuê"
            >
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Ghi nhận
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ghi nhận tiền cọc</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Khách thuê</Label>
                                <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn khách thuê" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {data.map((d) => (
                                            <SelectItem key={d.id} value={d.id}>
                                                {d.tenantName} — P.{d.roomNumber} ({d.propertyName})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Loại giao dịch</Label>
                                <Select value={depositType} onValueChange={(v) => setDepositType(v as any)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="RECEIVED">Nhận cọc</SelectItem>
                                        <SelectItem value="RETURNED">Trả cọc</SelectItem>
                                        <SelectItem value="DEDUCTED">Khấu trừ (hư hại, nợ, ...)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Số tiền (VND)</Label>
                                <Input
                                    type="number"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder="1000000"
                                />
                            </div>
                            <div>
                                <Label>Lý do (tùy chọn)</Label>
                                <Textarea
                                    value={depositReason}
                                    onChange={(e) => setDepositReason(e.target.value)}
                                    placeholder="VD: Cọc phòng mới, trừ tiền sửa cửa..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Hủy</Button>
                            </DialogClose>
                            <Button onClick={handleSubmit} disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Xác nhận
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PageHeader>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Tổng đang giữ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalHeld)}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Tổng đã nhận</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalReceived)}</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs text-muted-foreground">Tổng đã trả/khấu trừ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalReturned)}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Deposit Table */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <PiggyBank className="h-4 w-4" /> Danh sách tiền cọc
                    </CardTitle>
                    <CardDescription>{data.length} khách thuê đang thuê</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Khách thuê</TableHead>
                                <TableHead>Phòng</TableHead>
                                <TableHead className="text-right">Cọc HĐ</TableHead>
                                <TableHead className="text-right">Đã nhận</TableHead>
                                <TableHead className="text-right">Đã trả/trừ</TableHead>
                                <TableHead className="text-right">Số dư</TableHead>
                                <TableHead className="text-center">Trạng thái</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        Chưa có dữ liệu tiền cọc
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((d) => (
                                    <>
                                        <TableRow
                                            key={d.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                                        >
                                            <TableCell className="font-medium">{d.tenantName}</TableCell>
                                            <TableCell>P.{d.roomNumber} <span className="text-xs text-muted-foreground">({d.propertyName})</span></TableCell>
                                            <TableCell className="text-right text-muted-foreground">{formatCurrency(d.contractDeposit)}</TableCell>
                                            <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(d.received)}</TableCell>
                                            <TableCell className="text-right text-red-500">{formatCurrency(d.returned + d.deducted)}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(d.balance)}</TableCell>
                                            <TableCell className="text-center">
                                                {d.balance >= d.contractDeposit ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Đủ</Badge>
                                                ) : d.balance > 0 ? (
                                                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">Thiếu</Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">Chưa cọc</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    {expandedId === d.id ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        {expandedId === d.id && d.transactions.length > 0 && (
                                            <TableRow key={`${d.id}-detail`}>
                                                <TableCell colSpan={8} className="bg-muted/30 px-8 py-3">
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">Lịch sử giao dịch</p>
                                                    <div className="space-y-1.5">
                                                        {d.transactions.map((t: any) => {
                                                            const cfg = typeConfig[t.type];
                                                            const Icon = cfg.icon;
                                                            return (
                                                                <div key={t.id} className="flex items-center gap-3 text-sm">
                                                                    <Icon className={`h-4 w-4 ${cfg.color.split(" ")[0]}`} />
                                                                    <Badge className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                                                                    <span className="font-medium">{formatCurrency(t.amount)}</span>
                                                                    {t.reason && <span className="text-muted-foreground">— {t.reason}</span>}
                                                                    <span className="ml-auto text-xs text-muted-foreground">
                                                                        {new Date(t.date).toLocaleDateString("vi-VN")}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </DashboardShell>
    );
}
