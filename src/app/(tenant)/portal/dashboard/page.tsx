import { Button } from "@/components/ui/button";
import { FileText, Wrench, Bell, History, Zap, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function TenantDashboard() {
    const session = await auth();

    if (!session || session.user.role !== "TENANT") {
        redirect("/portal/login");
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.id },
        include: {
            roomTenants: {
                where: { isActive: true },
                include: {
                    room: { include: { property: true } },
                    contracts: { orderBy: { createdAt: "desc" }, take: 1 }
                }
            }
        }
    });

    const currentTenancy = tenant?.roomTenants[0];
    const property = currentTenancy?.room?.property;
    const latestContract = currentTenancy?.contracts[0];

    const announcements = property ? await prisma.announcement.findMany({
        where: { propertyId: property.id },
        orderBy: { createdAt: "desc" },
        take: 3
    }) : [];

    const pendingBills = await prisma.bill.findMany({
        where: {
            roomTenant: { tenantId: session.user.id },
            status: { in: ["PENDING", "OVERDUE"] },
        },
        orderBy: { dueDate: "asc" },
        include: { payments: true },
    });

    const recentBills = await prisma.bill.findMany({
        where: { roomTenant: { tenantId: session.user.id } },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { payments: true }
    });

    const totalBalance = pendingBills.reduce((sum, bill) => {
        const paid = bill.payments?.reduce((pSum, p) => pSum + p.amount, 0) || 0;
        return sum + (bill.total - paid);
    }, 0);

    const nextDueDate = pendingBills.length > 0 ? pendingBills[0].dueDate : null;
    const hasPending = totalBalance > 0;

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Credit Card Style Balance */}
            <div className={cn(
                "relative overflow-hidden rounded-[32px] p-7 shadow-2xl transition-all duration-500 will-change-transform",
                hasPending
                    ? "bg-gradient-to-br from-[#1E1B4B] via-[#4338CA] to-[#3730A3] text-white shadow-indigo-500/30"
                    : "bg-gradient-to-br from-[#064E3B] via-[#059669] to-[#047857] text-white shadow-emerald-500/30"
            )}>
                {/* Glossy overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent mix-blend-overlay pointer-events-none" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

                {/* Card Chip & WiFi icon simulation */}
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div className="h-9 w-12 bg-gradient-to-br from-amber-200 to-yellow-500 rounded-md shadow-inner flex items-center justify-center relative overflow-hidden">
                        {/* Chip details */}
                        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/20" />
                        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-black/20" />
                        <div className="h-5 w-7 border border-black/10 rounded-sm"></div>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-80">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse delay-75" />
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse delay-150" />
                    </div>
                </div>

                <div className="space-y-1 z-10 relative">
                    <p className="text-white/70 text-sm font-semibold tracking-wide uppercase">
                        {hasPending ? "Tổng dư nợ" : "Số dư tài khoản"}
                    </p>
                    <div className="flex items-baseline gap-1.5 drop-shadow-md">
                        <span className="text-[40px] leading-none font-black tracking-tight">
                            {totalBalance.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-2xl font-bold opacity-80">₫</span>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between z-10 relative">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-white/60 uppercase tracking-widest mb-0.5">Trạng thái</span>
                        {hasPending && nextDueDate ? (
                            <span className="text-sm font-bold truncate max-w-[140px] text-white/90">Hạn: {formatDate(nextDueDate)}</span>
                        ) : (
                            <span className="text-sm font-bold text-white/90">Đã tinh toán</span>
                        )}
                    </div>
                    <Button variant="secondary" className="rounded-full bg-white/95 text-slate-900 hover:bg-white font-bold px-6 shadow-[0_8px_16px_-4px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.3)] active:scale-95 transition-all duration-300 backdrop-blur-md" asChild>
                        <Link href="/portal/bills">
                            {hasPending ? "Thanh toán" : "Hóa đơn"}
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Premium Quick Actions */}
            <div className="grid grid-cols-4 gap-3">
                <Link href="/portal/bills" className="flex flex-col items-center gap-2 group cursor-pointer outline-none">
                    <div className="h-16 w-full max-w-[72px] bg-white dark:bg-zinc-900/80 rounded-[24px] shadow-sm border border-slate-100 dark:border-zinc-800/60 flex items-center justify-center text-blue-500 group-hover:shadow-md group-hover:border-blue-100 dark:group-hover:border-blue-900/50 group-active:scale-90 transition-all duration-300">
                        <FileText className="h-7 w-7 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="text-[11px] font-bold tracking-tight text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Hóa đơn</span>
                </Link>

                <Link href="/portal/incidents/new" className="flex flex-col items-center gap-2 group cursor-pointer outline-none">
                    <div className="h-16 w-full max-w-[72px] bg-white dark:bg-zinc-900/80 rounded-[24px] shadow-sm border border-slate-100 dark:border-zinc-800/60 flex items-center justify-center text-rose-500 group-hover:shadow-md group-hover:border-rose-100 dark:group-hover:border-rose-900/50 group-active:scale-90 transition-all duration-300">
                        <Wrench className="h-7 w-7 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="text-[11px] font-bold tracking-tight text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Báo sự cố</span>
                </Link>

                <Link href={latestContract ? `/portal/contracts/${latestContract.id}` : "#"} className="flex flex-col items-center gap-2 group cursor-pointer relative outline-none">
                    <div className="h-16 w-full max-w-[72px] bg-white dark:bg-zinc-900/80 rounded-[24px] shadow-sm border border-slate-100 dark:border-zinc-800/60 flex items-center justify-center text-amber-500 group-hover:shadow-md group-hover:border-amber-100 dark:group-hover:border-amber-900/50 group-active:scale-90 transition-all duration-300">
                        <FileText className="h-7 w-7 transition-transform group-hover:scale-110" />
                    </div>
                    {latestContract && latestContract.status !== 'SIGNED' && (
                        <span className="absolute -top-1 right-2 h-3.5 w-3.5 bg-rose-500 rounded-full border-[3px] border-[#f8fafc] dark:border-[#030712] animate-pulse shadow-sm"></span>
                    )}
                    <span className="text-[11px] font-bold tracking-tight text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Hợp đồng</span>
                </Link>

                <Link href="/portal/profile" className="flex flex-col items-center gap-2 group cursor-pointer outline-none">
                    <div className="h-16 w-full max-w-[72px] bg-white dark:bg-zinc-900/80 rounded-[24px] shadow-sm border border-slate-100 dark:border-zinc-800/60 flex items-center justify-center text-slate-500 dark:text-zinc-300 group-hover:shadow-md group-hover:border-slate-200 dark:group-hover:border-zinc-700 group-active:scale-90 transition-all duration-300">
                        <User className="h-7 w-7 transition-transform group-hover:scale-110" />
                    </div>
                    <span className="text-[11px] font-bold tracking-tight text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Cá nhân</span>
                </Link>
            </div>

            {/* Announcements */}
            {announcements.length > 0 && (
                <div className="space-y-4 pt-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                        Bảng tin Tòa nhà
                    </h3>
                    <div className="space-y-3">
                        {announcements.map((ann) => (
                            <div key={ann.id} className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md rounded-[24px] border border-slate-200/50 dark:border-zinc-800/50 shadow-sm p-4.5 relative overflow-hidden flex gap-4 hover:shadow-md transition-all">
                                <div className="h-12 w-12 bg-blue-100/50 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0">
                                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-[15px] truncate">{ann.title}</h4>
                                    <p className="text-[13px] text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{ann.content}</p>
                                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-2.5 font-semibold">
                                        {formatDate(ann.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="space-y-4 pt-2 pb-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                        <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                        Giao dịch gần đây
                    </h3>
                    <Link href="/portal/bills" className="text-[13px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center group bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                        Tất cả <ChevronRight className="h-3.5 w-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[28px] border border-slate-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden p-2">
                    <div className="flex flex-col gap-1">
                        {recentBills.map(bill => (
                            <div key={bill.id} className="p-3.5 rounded-[20px] flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 active:scale-[0.98] transition-all cursor-pointer">
                                <div className="flex items-center gap-3.5">
                                    <div className={cn("h-12 w-12 rounded-[16px] flex items-center justify-center font-black text-lg shadow-sm border",
                                        bill.status === "PAID"
                                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                                            : "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20"
                                    )}>
                                        T{bill.month}
                                    </div>
                                    <div>
                                        <p className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
                                            Hóa đơn tháng {bill.month}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 font-medium">{formatDate(bill.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn("text-base font-black tracking-tight", bill.status === "PAID" ? "text-slate-900 dark:text-white" : "text-orange-600 dark:text-orange-400")}>
                                        {formatCurrency(bill.total)}
                                    </p>
                                    <p className={cn("text-[10px] font-bold uppercase tracking-wider mt-1 rounded-full px-2 py-0.5 inline-block",
                                        bill.status === "PAID" ? "bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-orange-100/50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                                    )}>
                                        {bill.status === "PAID" ? "Thành công" : "Chưa trả"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {recentBills.length === 0 && (
                        <div className="py-12 flex flex-col items-center text-center">
                            <div className="h-14 w-14 bg-slate-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-3 shadow-inner">
                                <History className="h-7 w-7" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 font-semibold">Bạn chưa có giao dịch nào</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

