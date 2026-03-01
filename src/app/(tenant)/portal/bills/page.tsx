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
                    containerClass: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
                    amountClass: "text-slate-900 dark:text-white"
                };
            case "PENDING":
                return {
                    label: "Chờ thanh toán",
                    icon: Clock,
                    containerClass: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
                    amountClass: "text-amber-600 dark:text-amber-400"
                };
            case "OVERDUE":
                return {
                    label: "Quá hạn",
                    icon: AlertCircle,
                    containerClass: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20",
                    amountClass: "text-rose-600 dark:text-rose-400"
                };
            case "CANCELLED":
                return {
                    label: "Đã hủy",
                    icon: FileText,
                    containerClass: "bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-500 border-slate-100 dark:border-zinc-800",
                    amountClass: "text-slate-500 dark:text-zinc-500 line-through"
                };
            default:
                return {
                    label: status,
                    icon: FileText,
                    containerClass: "bg-slate-50 dark:bg-zinc-800 text-slate-500 border-slate-200 dark:border-zinc-700",
                    amountClass: "text-slate-900 dark:text-white"
                };
        }
    };

    const pendingCount = bills.filter(b => b.status === "PENDING" || b.status === "OVERDUE").length;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex items-end justify-between px-2 pt-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        Hóa đơn <span className="text-3xl">🧾</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1 max-w-[240px]">
                        {pendingCount > 0
                            ? <span className="text-orange-600 dark:text-orange-400">Bạn có <strong>{pendingCount}</strong> hóa đơn cần thanh toán.</span>
                            : 'Tất cả hóa đơn đã được thanh toán đầy đủ.'}
                    </p>
                </div>
            </div>

            {/* Bills List */}
            <div className="space-y-4">
                {bills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm rounded-[32px] border border-slate-200/50 dark:border-zinc-800/50 shadow-sm mt-6">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                            <div className="relative h-20 w-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border border-slate-100 dark:border-zinc-700 shadow-md">
                                <Receipt className="h-8 w-8 text-slate-400 dark:text-zinc-400" />
                            </div>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 tracking-tight">Chưa có hóa đơn nào</h3>
                        <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-[240px] font-medium leading-relaxed">
                            Hiện tại bạn chưa có hóa đơn nào từ ban quản lý. Hóa đơn mới sẽ hiển thị tại đây.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {bills.map((bill) => {
                            const status = getStatusConfig(bill.status);
                            const StatusIcon = status.icon;

                            return (
                                <Link
                                    key={bill.id}
                                    href={bill.invoice?.token ? `/invoice/${bill.invoice.token}` : "#"}
                                    className="block group active:scale-[0.98] transition-transform outline-none"
                                >
                                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[28px] p-5 shadow-sm border border-slate-200/50 dark:border-zinc-800/50 transition-all duration-300 relative overflow-hidden hover:shadow-md group-hover:border-indigo-100 dark:group-hover:border-indigo-900/30">
                                        <div className="flex items-center justify-between mb-5 relative z-10">
                                            <div className="flex items-center gap-3.5">
                                                <div className={cn("h-14 w-14 rounded-[20px] flex items-center justify-center shadow-sm border", status.containerClass)}>
                                                    <StatusIcon className="h-7 w-7" strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight">Tháng {bill.month}/{bill.year}</h3>
                                                    <div className="flex items-center text-xs text-slate-500 dark:text-zinc-400 font-semibold mt-1">
                                                        <Calendar className="h-3.5 w-3.5 mr-1" />
                                                        Hạn: {formatDate(bill.dueDate)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={cn("px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1 border shadow-sm", status.containerClass)}>
                                                {status.label}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/80 dark:bg-zinc-950/50 rounded-2xl p-4 flex justify-between items-center group-hover:bg-slate-100/80 dark:group-hover:bg-zinc-800/50 transition-colors border border-transparent group-hover:border-slate-200/50 dark:group-hover:border-zinc-700/50 relative z-10">
                                            <div className="flex items-center text-[13px] text-slate-500 dark:text-zinc-400 font-bold">
                                                Xem chi tiết hóa đơn
                                            </div>
                                            <div className="text-right flex items-center gap-2">
                                                <span className={cn("text-xl font-black tracking-tight", status.amountClass)}>
                                                    {formatCurrency(bill.total)}
                                                </span>
                                                <ChevronRight className="h-4.5 w-4.5 text-slate-300 dark:text-zinc-600 group-hover:text-slate-500 dark:group-hover:text-zinc-400 transition-colors" />
                                            </div>
                                        </div>

                                        {/* Subtle highlight effect on hover */}
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-50/30 to-transparent dark:from-indigo-900/10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
