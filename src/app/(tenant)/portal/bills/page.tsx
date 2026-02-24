import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/billing";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, AlertCircle, CheckCircle2, Clock, ChevronRight, Receipt, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function TenantBillsPage() {
    const session = await auth();

    if (!session || session.user.role !== "TENANT") {
        redirect("/portal/login");
    }

    const bills = await prisma.bill.findMany({
        where: {
            roomTenant: {
                tenantId: session.user.id,
            },
        },
        include: {
            invoice: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "PAID":
                return {
                    label: "Đã thanh toán",
                    icon: CheckCircle2,
                    containerClass: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    amountClass: "text-slate-900 dark:text-white"
                };
            case "PENDING":
                return {
                    label: "Chờ thanh toán",
                    icon: Clock,
                    containerClass: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    amountClass: "text-amber-600 dark:text-amber-400"
                };
            case "OVERDUE":
                return {
                    label: "Quá hạn",
                    icon: AlertCircle,
                    containerClass: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
                    amountClass: "text-rose-600 dark:text-rose-400"
                };
            case "CANCELLED":
                return {
                    label: "Đã hủy",
                    icon: FileText,
                    containerClass: "bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400",
                    amountClass: "text-slate-500 dark:text-zinc-500 line-through"
                };
            default:
                return {
                    label: status,
                    icon: FileText,
                    containerClass: "bg-slate-50 dark:bg-zinc-800 text-slate-500",
                    amountClass: "text-slate-900 dark:text-white"
                };
        }
    };

    const pendingCount = bills.filter(b => b.status === "PENDING" || b.status === "OVERDUE").length;

    return (
        <div className="w-full max-w-lg mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex items-end justify-between px-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Hóa đơn</h1>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                        {pendingCount > 0
                            ? `Bạn có ${pendingCount} hóa đơn cần thanh toán`
                            : 'Tất cả hóa đơn đã được thanh toán'}
                    </p>
                </div>
            </div>

            {/* Bills List */}
            <div className="space-y-4">
                {bills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="h-24 w-24 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-5 border border-slate-200 dark:border-zinc-800">
                            <Receipt className="h-10 w-10 text-slate-300 dark:text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Trống trơn</h3>
                        <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-[240px]">
                            Hiện tại bạn chưa có hóa đơn nào từ ban quản lý.
                        </p>
                    </div>
                ) : (
                    bills.map((bill) => {
                        const status = getStatusConfig(bill.status);
                        const StatusIcon = status.icon;

                        return (
                            <Link
                                key={bill.id}
                                href={bill.invoice?.token ? `/invoice/${bill.invoice.token}` : "#"}
                                className="block group active:scale-[0.98] transition-transform"
                            >
                                <div className="bg-white dark:bg-zinc-900 rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-zinc-800 transition-all duration-300 relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("h-12 w-12 rounded-[18px] flex items-center justify-center shadow-sm", status.containerClass)}>
                                                {bill.status === "PAID" ? <CheckCircle2 className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-slate-900 dark:text-white text-[15px]">Tháng {bill.month}/{bill.year}</h3>
                                                <div className="flex items-center text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    Hạn: {formatDate(bill.dueDate)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase flex items-center gap-1", status.containerClass)}>
                                            {status.label}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-zinc-950/50 rounded-2xl p-4 flex justify-between items-center group-hover:bg-slate-100 dark:group-hover:bg-zinc-800 transition-colors">
                                        <div className="flex items-center text-xs text-slate-500 dark:text-zinc-400 font-medium">
                                            Xem chi tiết hóa đơn
                                        </div>
                                        <div className="text-right flex items-center gap-2">
                                            <span className={cn("text-lg font-black tracking-tight", status.amountClass)}>
                                                {formatCurrency(bill.total)}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-zinc-600 group-hover:text-slate-500 dark:group-hover:text-zinc-400 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
