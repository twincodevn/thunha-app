import { Button } from "@/components/ui/button";
import { LogOut, FileText, Wrench, Bell, History, Zap, CreditCard, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";

// For client component, we'll fetch data in useEffect or use SWR/React Query.
// But to keep it simple and preserve the server-side nature of Next.js page,
// we should ideally keep the page as a Server Component and add just a Client Component wrapper for animations.
// Wait, to do that easily here, I'll use a mixed approach or make the page a server component that imports a client component.
// Since I must replace the whole file, I will keep the server fetching from the original file, and extract the UI to a Client wrapper inside the same file?
// Next.js App Router doesn't allow "use client" in a file with Server-side async data fetching (export default async function).
// Let me write the standard Async Server Component, and use basic Tailwind CSS animations instead of framer-motion, 
// OR keep it server component for Data, and skip framer motion here to avoid breaking server/client boundaries in one file.
// I will use pure Tailwind CSS for premium animations (group-hover, active:scale, animate-in, slide-in-from-bottom, etc.)

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
        <div className="w-full max-w-lg mx-auto space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Credit Card Style Balance */}
            <div className={cn(
                "relative overflow-hidden rounded-[24px] p-6 shadow-2xl transition-all duration-500",
                hasPending
                    ? "bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 text-white shadow-indigo-500/40"
                    : "bg-gradient-to-br from-teal-400 via-emerald-500 to-teal-600 text-white shadow-emerald-500/40"
            )}>
                {/* Card Chip & WiFi icon simulation */}
                <div className="flex justify-between items-center mb-6">
                    <div className="h-8 w-12 bg-white/20 rounded-md border border-white/30 flex items-center justify-center">
                        <div className="h-4 w-6 border border-white/40 rounded-sm opacity-50"></div>
                    </div>
                    <span className="text-white/80 text-xs font-semibold tracking-widest uppercase">
                        VISA
                    </span>
                </div>

                <div className="space-y-1 z-10 relative">
                    <p className="text-white/80 text-sm font-medium">
                        {hasPending ? "Tổng dư nợ cần thanh toán" : "Tài khoản của bạn"}
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold tracking-tight">
                            {totalBalance.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-xl font-bold opacity-80">₫</span>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-between z-10 relative">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-white/70 uppercase tracking-wider mb-0.5">Trạng thái</span>
                        {hasPending && nextDueDate ? (
                            <span className="text-sm font-bold truncate max-w-[140px]">Hạn: {formatDate(nextDueDate)}</span>
                        ) : (
                            <span className="text-sm font-bold">Đã thanh toán hết</span>
                        )}
                    </div>
                    <Button variant="secondary" className="rounded-full bg-white text-indigo-700 hover:bg-white/90 font-bold px-6 shadow-lg shadow-black/10 active:scale-95 transition-all" asChild>
                        <Link href="/portal/bills">
                            {hasPending ? "Thanh toán ngay" : "Xem hóa đơn"}
                        </Link>
                    </Button>
                </div>

                {/* Abstract Card Background Decorations */}
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
            </div>

            {/* Quick Actions (Apple Style) */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
                <Link href="/portal/bills" className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="h-16 w-16 bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-slate-100 dark:border-zinc-800 flex items-center justify-center text-blue-500 group-active:scale-90 transition-all duration-300">
                        <FileText className="h-7 w-7" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Hóa đơn</span>
                </Link>

                <Link href="/portal/incidents/new" className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="h-16 w-16 bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-slate-100 dark:border-zinc-800 flex items-center justify-center text-rose-500 group-active:scale-90 transition-all duration-300">
                        <Wrench className="h-7 w-7" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Báo sự cố</span>
                </Link>

                <Link href={latestContract ? `/portal/contracts/${latestContract.id}` : "#"} className="flex flex-col items-center gap-2 group cursor-pointer relative">
                    <div className="h-16 w-16 bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-slate-100 dark:border-zinc-800 flex items-center justify-center text-amber-500 group-active:scale-90 transition-all duration-300">
                        <FileText className="h-7 w-7" />
                    </div>
                    {latestContract && latestContract.status !== 'SIGNED' && (
                        <span className="absolute top-0 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse"></span>
                    )}
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Hợp đồng</span>
                </Link>

                <Link href="/portal/profile" className="flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="h-16 w-16 bg-white dark:bg-zinc-900 rounded-[20px] shadow-sm border border-slate-100 dark:border-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 group-active:scale-90 transition-all duration-300">
                        <User className="h-7 w-7" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400">Cài đặt</span>
                </Link>
            </div>

            {/* Announcements */}
            {announcements.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="h-6 w-1.5 bg-blue-500 rounded-full"></div>
                        Bảng tin Tòa nhà
                    </h3>
                    <div className="space-y-3">
                        {announcements.map((ann) => (
                            <div key={ann.id} className="bg-white dark:bg-zinc-900 rounded-[20px] border border-slate-100 dark:border-zinc-800 shadow-sm p-4 relative overflow-hidden flex gap-4 active:scale-[0.98] transition-transform">
                                <div className="h-12 w-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
                                    <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{ann.title}</h4>
                                    <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed tracking-tight">{ann.content}</p>
                                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                        {formatDate(ann.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <div className="h-6 w-1.5 bg-indigo-500 rounded-full"></div>
                        Giao dịch gần đây
                    </h3>
                    <Link href="/portal/bills" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold flex items-center group">
                        Xem tất cả <ChevronRight className="h-4 w-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-zinc-800/50">
                    {recentBills.map(bill => (
                        <div key={bill.id} className="p-4 flex items-center justify-between active:bg-slate-50 dark:active:bg-zinc-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={cn("h-12 w-12 rounded-[18px] flex items-center justify-center font-bold text-lg",
                                    bill.status === "PAID" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                )}>
                                    T{bill.month}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        Hóa đơn tháng {bill.month}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">{formatDate(bill.createdAt)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={cn("text-[15px] font-bold", bill.status === "PAID" ? "text-slate-900 dark:text-white" : "text-orange-600 dark:text-orange-400")}>
                                    {formatCurrency(bill.total)}
                                </p>
                                <p className="text-[10px] font-medium text-slate-400 uppercase mt-1">
                                    {bill.status === "PAID" ? "Thành công" : "Chưa trả"}
                                </p>
                            </div>
                        </div>
                    ))}
                    {recentBills.length === 0 && (
                        <div className="py-12 flex flex-col items-center text-center">
                            <div className="h-12 w-12 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center text-slate-300 dark:text-zinc-600 mb-2">
                                <History className="h-6 w-6" />
                            </div>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">Bạn chưa có giao dịch nào</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

