
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Search, FileText, Loader2, MoreHorizontal, Download, Send, Eye, Lock, MessageSquare, LayoutGrid, List } from "lucide-react";
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
                <div className="flex gap-2">
                    {/* Batch reminder */}
                    <Button
                        variant="outline"
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
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Nhắc nhở ({bills.filter(b => b.status === "PENDING" || b.status === "OVERDUE").length})
                    </Button>

                    {/* Export Report Button (Premium) */}
                    <Button variant="outline" onClick={() => !planConfig.hasAdvancedReports && handlePremiumFeature("Báo cáo")}>
                        {!planConfig.hasAdvancedReports && <Lock className="mr-2 h-3 w-3 text-muted-foreground" />}
                        Xuất báo cáo
                    </Button>

                    <Button asChild>
                        <Link href="/dashboard/billing/generate">
                            <Plus className="mr-2 h-4 w-4" />
                            Lập hóa đơn mới
                        </Link>
                    </Button>
                </div>
            </PageHeader>

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
                        <div className="text-center py-12 text-muted-foreground">
                            {searchTerm ? "Không có hóa đơn nào phù hợp với tìm kiếm." : "Chưa có hóa đơn nào cho tháng này."}
                        </div>
                    ) : viewMode === "KANBAN" ? (
                        <div className="px-1 overflow-x-hidden">
                            <BillingKanban initialBills={filteredBills} />
                        </div>
                    ) : (
                        <div className="rounded-md border mx-0 sm:mx-0 overflow-x-auto">
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
