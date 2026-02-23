import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    LogOut, Home, User, FileText, Wrench, Bell,
    CreditCard, ChevronRight, History, Zap, Droplets, ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/billing";
import { cn } from "@/lib/utils";

export default async function TenantDashboard() {
    const session = await auth();

    if (!session || session.user.role !== "TENANT") {
        redirect("/portal/login");
    }

    // Fetch tenant details including Room, Property, and Contract
    const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.id },
        include: {
            roomTenants: {
                where: { isActive: true },
                include: {
                    room: {
                        include: {
                            property: true
                        }
                    },
                    contracts: {
                        orderBy: { createdAt: "desc" },
                        take: 1
                    }
                }
            }
        }
    });

    const currentTenancy = tenant?.roomTenants[0];
    const room = currentTenancy?.room;
    const property = room?.property;
    const latestContract = currentTenancy?.contracts[0];

    // Fetch announcements for the property
    const announcements = property ? await prisma.announcement.findMany({
        where: { propertyId: property.id },
        orderBy: { createdAt: "desc" },
        take: 3
    }) : [];

    // Fetch pending bills
    const pendingBills = await prisma.bill.findMany({
        where: {
            roomTenant: {
                tenantId: session.user.id,
            },
            status: {
                in: ["PENDING", "OVERDUE"],
            },
        },
        orderBy: {
            dueDate: "asc",
        },
        include: {
            payments: true,
        },
    });

    // Recent Activity (Bills + Payments)
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
        <div className="min-h-screen bg-slate-50/50 pb-4">
            <main className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6 max-w-7xl mx-auto">
                <div className="lg:col-span-2 space-y-6">
                    {/* Hero / Balance Card */}
                    <div className={cn(
                        "relative overflow-hidden rounded-[2rem] p-7 shadow-xl transition-all duration-500",
                        hasPending
                            ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white shadow-indigo-500/30"
                            : "bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 text-white shadow-emerald-500/30"
                    )}>
                        {/* Abstract Shapes */}
                        <div className="absolute top-0 right-0 -mr-12 -mt-12 h-48 w-48 rounded-full bg-white/10 blur-3xl mix-blend-overlay"></div>
                        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 h-48 w-48 rounded-full bg-white/10 blur-3xl mix-blend-overlay"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <p className="text-white/80 text-sm font-medium mb-1 tracking-wide">
                                {hasPending ? "Dư nợ cần thanh toán" : "Tài khoản của bạn"}
                            </p>
                            <div className="flex items-baseline justify-center gap-1 mb-6">
                                <h2 className="text-5xl font-bold tracking-tighter">
                                    {totalBalance.toLocaleString('vi-VN')}
                                </h2>
                                <span className="text-2xl font-medium opacity-70">đ</span>
                            </div>

                            {hasPending && nextDueDate ? (
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold text-white/95 mb-6 border border-white/20">
                                    <History className="h-3.5 w-3.5" />
                                    Hạn chót: {formatDate(nextDueDate)}
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold text-white/95 mb-6 border border-white/20">
                                    <CreditCard className="h-3.5 w-3.5" />
                                    Đã thanh toán hết
                                </div>
                            )}

                            <div className="w-full grid grid-cols-2 gap-3">
                                {/* Payment Action */}
                                <Button className="w-full bg-white text-indigo-700 hover:bg-white/90 font-bold shadow-lg shadow-black/10 rounded-2xl h-12 text-base transition-transform active:scale-[0.98]" asChild>
                                    <Link href="/portal/bills">
                                        Thanh toán
                                    </Link>
                                </Button>
                                <Button variant="outline" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white rounded-2xl h-12 backdrop-blur-sm transition-transform active:scale-[0.98]" asChild>
                                    <Link href="/portal/bills">
                                        Chi tiết
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Grid - iOS Style */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-4 px-1 flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-slate-400" />
                            Tiện ích nhanh
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                            <Link href="/portal/bills" className="flex flex-col items-center gap-2 group">
                                <div className="h-[4.5rem] w-[4.5rem] bg-white rounded-[1.2rem] shadow-sm border border-slate-100 flex items-center justify-center text-blue-500 group-active:scale-95 transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                                    <div className="h-8 w-8 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                </div>
                                <span className="text-[11px] font-medium text-slate-600">Hóa đơn</span>
                            </Link>

                            <Link href="/portal/incidents" className="flex flex-col items-center gap-2 group">
                                <div className="h-[4.5rem] w-[4.5rem] bg-white rounded-[1.2rem] shadow-sm border border-slate-100 flex items-center justify-center text-rose-500 group-active:scale-95 transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                                    <div className="h-8 w-8 bg-rose-50 rounded-xl flex items-center justify-center">
                                        <Wrench className="h-5 w-5" />
                                    </div>
                                </div>
                                <span className="text-[11px] font-medium text-slate-600">Báo hỏng</span>
                            </Link>

                            {/* Contract */}
                            {latestContract ? (
                                <Link href={`/portal/contracts/${latestContract.id}`} className="flex flex-col items-center gap-2 group">
                                    <div className="h-[4.5rem] w-[4.5rem] bg-white rounded-[1.2rem] shadow-sm border border-slate-100 flex items-center justify-center text-amber-500 group-active:scale-95 transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1 relative">
                                        <div className="h-8 w-8 bg-amber-50 rounded-xl flex items-center justify-center">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        {latestContract.status !== 'SIGNED' && (
                                            <span className="absolute top-3 right-3 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-600">Hợp đồng</span>
                                </Link>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-slate-300 cursor-not-allowed">
                                    <div className="h-[4.5rem] w-[4.5rem] bg-slate-50 rounded-[1.2rem] border border-slate-100 flex items-center justify-center">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <span className="text-[11px] font-medium">Hợp đồng</span>
                                </div>
                            )}

                            <form
                                action={async () => {
                                    "use server";
                                    await signOut({ redirectTo: "/portal/login" });
                                }}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <button className="h-[4.5rem] w-[4.5rem] bg-white rounded-[1.2rem] shadow-sm border border-slate-100 flex items-center justify-center text-slate-500 group-active:scale-95 transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                                    <div className="h-8 w-8 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                                        <LogOut className="h-5 w-5" />
                                    </div>
                                </button>
                                <span className="text-[11px] font-medium text-slate-600">Đăng xuất</span>
                            </form>
                        </div>
                    </div>

                    {/* Announcements list */}
                    {announcements.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 mb-4 px-1 flex items-center gap-2">
                                <Bell className="h-4 w-4 text-blue-500" />
                                Bảng tin từ Ban quản lý
                            </h3>
                            <div className="space-y-3">
                                {announcements.map((ann) => (
                                    <div key={ann.id} className="bg-white rounded-[1.5rem] border shadow-sm p-5 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-2 h-full bg-blue-500 rounded-r-[1.5rem]"></div>
                                        <div className="flex gap-4">
                                            <div className="mt-1 h-10 w-10 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                                                <Bell className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 leading-tight mb-1">{ann.title}</h4>
                                                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                                                <p className="text-[11px] text-slate-400 mt-3 font-medium">
                                                    {formatDate(ann.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar (Desktop) */}
                <div className="lg:col-span-1">
                    {/* Recent Transactions - Clean List */}
                    <div className="bg-white rounded-[2rem] border shadow-sm p-1">
                        <div className="flex items-center justify-between mb-2 px-4 pt-4">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <History className="h-4 w-4 text-slate-400" />
                                Gần đây
                            </h3>
                            <Link href="/portal/bills" className="text-xs text-indigo-600 font-semibold flex items-center hover:underline">
                                Xem tất cả <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentBills.map(bill => (
                                <div key={bill.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                                            bill.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                                        )}>
                                            {bill.status === "PAID" ? <CreditCard className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                T{bill.month}
                                            </p>
                                            <p className="text-[10px] text-slate-500">{formatDate(bill.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn("text-sm font-bold", bill.status === "PAID" ? "text-slate-900" : "text-orange-600")}>
                                            -{formatCurrency(bill.total)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {recentBills.length === 0 && (
                                <div className="py-12 flex flex-col items-center text-center">
                                    <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">Chưa có giao dịch nào</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

