
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Search, FileText, Loader2, MoreHorizontal, Download, Send, Eye, Lock, MessageSquare, LayoutGrid, List, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getBills, getBatchReminderData } from "./actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { formatCurrency } from "@/lib/billing";
import { PLANS, UserPlan } from "@/lib/plans";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { BillingKanban } from "@/components/billing/billing-kanban";

// Enum mapping for display
const statusMap: Record<string, { label: string; color: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    DRAFT: { label: "Nháp", color: "text-gray-600 bg-gray-100 border-gray-200 dark:bg-gray-800 dark:text-gray-400", variant: "outline" },
    PENDING: { label: "Chờ thanh toán", color: "text-amber-600 bg-amber-100 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400", variant: "outline" },
    PAID: { label: "Đã thanh toán", color: "text-emerald-600 bg-emerald-100 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400", variant: "outline" },
    OVERDUE: { label: "Quá hạn", color: "text-red-600 bg-red-100 border-red-200 dark:bg-red-900/40 dark:text-red-400", variant: "outline" },
    CANCELLED: { label: "Đã hủy", color: "text-gray-500 bg-gray-100 border-gray-200 dark:bg-gray-800 dark:text-gray-400", variant: "outline" },
};

export default function BillingPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [bills, setBills] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));
    const [status, setStatus] = useState<string>("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<"TABLE" | "KANBAN">("TABLE");

    const userPlan = session?.user?.plan as UserPlan || "FREE";
    const planConfig = PLANS[userPlan];

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

    const filteredBills = bills.filter(bill =>
        bill.roomTenant.room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.roomTenant.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handlePremiumFeature = (featureName: string) => {
        toast.error(`Tính năng ${featureName} chỉ dành cho gói Basic trở lên`, {
            action: {
                label: "Nâng cấp",
                onClick: () => router.push("/dashboard/subscription")
            }
        });
    };

    return (
        <DashboardShell>
            <PageHeader
                title="Quản lý hóa đơn"
                description="Theo dõi và quản lý hóa đơn tiền nhà hàng tháng"
            >
                <div className="flex flex-wrap gap-2">
                    {/* Batch reminder */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800"
                        onClick={async () => {
                            const data = await getBatchReminderData();
                            if (data.error) { toast.error(data.error); return; }
                            if (!data.bills || data.bills.length === 0) { toast.info("Không có hóa đơn cần nhắc nhở"); return; }
                            const messages = data.bills.map(b => `${b.tenantName} (P.${b.roomNumber}): ${b.message}\nZalo: ${b.zaloLink}`).join("\n\n");
                            await navigator.clipboard.writeText(messages);
                            toast.success(`Đã copy ${data.bills.length} tin nhắn nhắc nhở!`);
                        }}
                    >
                        <MessageSquare className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Nhắc nhở ({bills.filter(b => b.status === "PENDING" || b.status === "OVERDUE").length})</span>
                    </Button>

                    {/* Export Report Button (Premium) */}
                    <Button size="sm" variant="outline" onClick={() => !planConfig.hasAdvancedReports && handlePremiumFeature("Báo cáo")}>
                        {!planConfig.hasAdvancedReports && <Lock className="h-3 w-3 sm:mr-2 text-muted-foreground" />}
                        <span className="hidden sm:inline">Xuất báo cáo</span>
                        <span className="sm:hidden">Báo cáo</span>
                    </Button>

                    <Button size="sm" asChild>
                        <Link href="/dashboard/billing/generate">
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Lập hóa đơn mới</span>
                            <span className="sm:hidden">Lập hoá đơn</span>
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            {/* WOW FACTOR: AI Bad Debt Detection Banner */}
            {bills.filter(b => b.status === "OVERDUE").length > 0 && (
                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-100 dark:border-red-900/50 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <span className="absolute -inset-1 rounded-full bg-red-400/30 animate-ping"></span>
                            <div className="h-12 w-12 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-red-200 dark:border-red-800 relative z-10 shadow-sm">
                                <AlertCircle className="h-6 w-6 text-red-500" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-[10px] px-1.5 py-0">AI Nhận diện</Badge>
                                <h3 className="font-bold text-red-900 dark:text-red-400">Phát hiện {bills.filter(b => b.status === "OVERDUE").length} khoản nợ chờ thu</h3>
                            </div>
                            <p className="text-sm text-red-700/80 dark:text-red-300">Tổng dòng tiền đang kẹt: <span className="font-semibold">{formatCurrency(bills.filter(b => b.status === "OVERDUE").reduce((sum, b) => sum + b.total, 0))}</span></p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="destructive"
                        className="w-full sm:w-auto rounded-full shadow-md shadow-red-500/20 hover:scale-105 active:scale-95 transition-all"
                        onClick={async () => {
                            const data = await getBatchReminderData();
                            if (data.error) { toast.error(data.error); return; }
                            const overdue = data.bills.filter((b: any) => b.status === "OVERDUE");
                            const messages = overdue.map((b: any) => `${b.tenantName} (P.${b.roomNumber}): ${b.message}\nZalo: ${b.zaloLink}`).join("\n\n");
                            await navigator.clipboard.writeText(messages);
                            toast.success(`Đã sao chép kịch bản đòi nợ AI cho ${overdue.length} phòng!`);
                        }}
                    >
                        <Send className="w-4 h-4 mr-2" />
                        Gửi nhắc nợ tự động
                    </Button>
                </div>
            )}

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="w-[110px]">
                                    <SelectValue placeholder="Tháng" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                        <SelectItem key={m} value={String(m)}>Tháng {m}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="w-[90px]">
                                    <SelectValue placeholder="Năm" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 3 }, (_, i) => String(new Date().getFullYear() - 1 + i)).map((y) => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="relative w-full lg:w-[300px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tìm phòng, tên khách..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Status Tabs */}
                    <div className="flex flex-wrap gap-1.5">
                        {[
                            { key: "ALL", label: "Tất cả" },
                            { key: "PENDING", label: "Chờ thanh toán" },
                            { key: "PAID", label: "Đã thanh toán" },
                            { key: "OVERDUE", label: "Quá hạn" },
                            { key: "CANCELLED", label: "Đã hủy" },
                        ].map((tab) => {
                            const count = tab.key === "ALL"
                                ? bills.length
                                : bills.filter((b) => b.status === tab.key).length;
                            const isActive = status === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setStatus(tab.key)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${isActive
                                        ? tab.key === "OVERDUE"
                                            ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 shadow-sm"
                                            : tab.key === "PAID"
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 shadow-sm"
                                                : tab.key === "PENDING"
                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 shadow-sm"
                                                    : "bg-primary/10 text-primary shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    {tab.label}
                                    {count > 0 && (
                                        <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-bold ${isActive ? "bg-white/60 dark:bg-white/20" : "bg-muted-foreground/10"
                                            }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {/* View Toggle */}
                    <div className="flex justify-end mt-4 pt-4 border-t w-full">
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "TABLE" | "KANBAN")}>
                            <TabsList className="grid w-full grid-cols-2 lg:w-[200px]">
                                <TabsTrigger value="TABLE">
                                    <List className="w-4 h-4 mr-2" />
                                    Danh sách
                                </TabsTrigger>
                                <TabsTrigger value="KANBAN">
                                    <LayoutGrid className="w-4 h-4 mr-2" />
                                    Bảng (Kanban)
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredBills.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-50/50 dark:bg-zinc-800/20 rounded-2xl border border-slate-100 dark:border-zinc-800/50 m-4 animate-in fade-in duration-500">
                            <div className="h-16 w-16 bg-white dark:bg-zinc-800 shadow-sm rounded-full flex items-center justify-center mb-4 ring-1 ring-slate-100 dark:ring-zinc-700">
                                <FileText className="h-8 w-8 text-slate-400 dark:text-zinc-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                {searchTerm ? "Không tìm thấy hóa đơn" : "Bảng hóa đơn trống"}
                            </h3>
                            <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-sm mb-6 leading-relaxed">
                                {searchTerm
                                    ? "Thử thay đổi từ khóa tìm kiếm hoặc xóa các bộ lọc trạng thái để xem nhiều kết quả hơn."
                                    : "Bạn chưa có hóa đơn nào cho tháng này. Hãy lập hóa đơn mới để bắt đầu theo dõi thu chi."}
                            </p>
                            {!searchTerm && (
                                <Button asChild className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95">
                                    <Link href="/dashboard/billing/generate">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Lập hóa đơn mới
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ) : viewMode === "KANBAN" ? (
                        <div className="px-1 overflow-x-hidden">
                            <BillingKanban initialBills={filteredBills} />
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead className="w-[100px]">Mã HĐ</TableHead>
                                        <TableHead>Phòng</TableHead>
                                        <TableHead>Khách thuê</TableHead>
                                        <TableHead className="text-right">Tổng tiền</TableHead>
                                        <TableHead>Hạn thu</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead className="text-right w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredBills.map((bill) => (
                                        <TableRow key={bill.id}>
                                            <TableCell className="font-medium text-xs text-muted-foreground">
                                                #{bill.id.slice(-6).toUpperCase()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{bill.roomTenant.room.roomNumber}</span>
                                                    <span className="text-xs text-muted-foreground">{bill.roomTenant.room.property.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-sm">{bill.roomTenant.tenant.name}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-base">
                                                {formatCurrency(bill.total)}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {format(new Date(bill.dueDate), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusMap[bill.status]?.variant as any || "outline"} className={`font-normal ${statusMap[bill.status]?.color}`}>
                                                    {statusMap[bill.status]?.label || bill.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/billing/${bill.id}`} className="cursor-pointer">
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Chi tiết
                                                            </Link>
                                                        </DropdownMenuItem>

                                                        {/* Export PDF - Premium Feature */}
                                                        <DropdownMenuItem
                                                            disabled={!planConfig.canExportPdf}
                                                            onClick={(e) => {
                                                                if (!planConfig.canExportPdf) {
                                                                    e.preventDefault();
                                                                    handlePremiumFeature("Xuất PDF");
                                                                }
                                                            }}
                                                        >
                                                            <Download className="mr-2 h-4 w-4" />
                                                            {planConfig.canExportPdf ? "Tải PDF (Sắp có)" : "Tải PDF (Pro)"}
                                                            {!planConfig.canExportPdf && <Lock className="ml-auto h-3 w-3" />}
                                                        </DropdownMenuItem>

                                                        {/* Send Reminder - Premium Feature */}
                                                        {bill.status === "PENDING" || bill.status === "OVERDUE" ? (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className={planConfig.canSendReminders ? "text-blue-600 focus:text-blue-600" : ""}
                                                                    disabled={!planConfig.canSendReminders}
                                                                    onClick={(e) => {
                                                                        if (!planConfig.canSendReminders) {
                                                                            e.preventDefault();
                                                                            handlePremiumFeature("Gửi nhắc nhở");
                                                                        }
                                                                    }}
                                                                >
                                                                    <Send className="mr-2 h-4 w-4" />
                                                                    {planConfig.canSendReminders ? "Gửi nhắc nhở" : "Gửi nhắc nhở (Pro)"}
                                                                    {!planConfig.canSendReminders && <Lock className="ml-auto h-3 w-3" />}
                                                                </DropdownMenuItem>
                                                            </>
                                                        ) : null}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </DashboardShell >
    );
}
