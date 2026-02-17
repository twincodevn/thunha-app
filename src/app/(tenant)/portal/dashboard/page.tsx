
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    LogOut, Home, User, FileText, Wrench, Bell,
    CreditCard, ChevronRight, History, Zap, Droplets
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
                        where: { status: "SIGNED" },
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

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b z-20 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                        <AvatarImage src={session.user.image || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            {session.user.name?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Xin chào,</p>
                        <h1 className="text-sm font-bold text-slate-900 leading-none">{session.user.name}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full relative text-slate-500">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                    </Button>
                </div>
            </header>

            <main className="pt-20 px-4 space-y-6">
                {/* Hero / Balance Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-500/20 p-6">
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-32 w-32 rounded-full bg-purple-500/20 blur-2xl"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-blue-100 text-sm font-medium opacity-80 mb-1">Dư nợ hiện tại</p>
                                <h2 className="text-4xl font-bold tracking-tight">
                                    {totalBalance.toLocaleString('vi-VN')}
                                    <span className="text-xl opacity-60 ml-1">đ</span>
                                </h2>
                            </div>
                            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                                <CreditCard className="h-6 w-6 text-white" />
                            </div>
                        </div>

                        {nextDueDate && (
                            <div className="inline-flex items-center gap-2 bg-red-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-red-100 mb-6 border border-red-500/30">
                                <History className="h-3 w-3" />
                                Hạn thanh toán: {formatDate(nextDueDate)}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {/* Payment Action will likely link to specific bill or a generic payment page */}
                            <Button className="w-full bg-white text-indigo-700 hover:bg-white/90 font-bold shadow-lg shadow-black/5 rounded-xl h-11" asChild>
                                <Link href="/portal/bills">
                                    Thanh toán ngay
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white rounded-xl h-11" asChild>
                                <Link href="/portal/bills">
                                    Xem chi tiết
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Property Info */}
                {room && (
                    <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                <Home className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">{property?.name}</p>
                                <p className="text-sm font-bold text-slate-900">Phòng {room.roomNumber}</p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                            Đang thuê
                        </Badge>
                    </div>
                )}

                {/* Quick Actions Grid */}
                <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3 px-1">Tiện ích</h3>
                    <div className="grid grid-cols-4 gap-3">
                        <Link href="/portal/bills" className="flex flex-col items-center gap-2 group">
                            <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border flex items-center justify-center text-indigo-600 group-active:scale-95 transition-transform">
                                <FileText className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">Hóa đơn</span>
                        </Link>
                        <Link href="/portal/incidents" className="flex flex-col items-center gap-2 group">
                            <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border flex items-center justify-center text-rose-500 group-active:scale-95 transition-transform">
                                <Wrench className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">Báo hỏng</span>
                        </Link>
                        <Link href="/portal/dashboard" className="flex flex-col items-center gap-2 group opacity-50 cursor-not-allowed">
                            <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border flex items-center justify-center text-amber-500">
                                <User className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-medium text-slate-600">Dịch vụ</span>
                        </Link>
                        <form
                            action={async () => {
                                "use server";
                                await signOut({ redirectTo: "/portal/login" });
                            }}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <button className="h-12 w-12 bg-white rounded-2xl shadow-sm border flex items-center justify-center text-slate-500 group-active:scale-95 transition-transform">
                                <LogOut className="h-6 w-6" />
                            </button>
                            <span className="text-[10px] font-medium text-slate-600">Đăng xuất</span>
                        </form>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-sm font-bold text-slate-900">Hoạt động gần đây</h3>
                        <Link href="/portal/bills" className="text-xs text-indigo-600 font-medium">Xem tất cả</Link>
                    </div>
                    <div className="bg-white rounded-2xl border shadow-sm divide-y">
                        {recentBills.map(bill => (
                            <div key={bill.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center",
                                        bill.status === "PAID" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"
                                    )}>
                                        {bill.status === "PAID" ? <CreditCard className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">
                                            Hóa đơn tháng {bill.month}/{bill.year}
                                        </p>
                                        <p className="text-xs text-slate-500">{formatDate(bill.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={cn("text-sm font-bold", bill.status === "PAID" ? "text-slate-900" : "text-orange-600")}>
                                        -{formatCurrency(bill.total)}
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-500 uppercase">{bill.status}</p>
                                </div>
                            </div>
                        ))}
                        {recentBills.length === 0 && (
                            <div className="p-6 text-center text-slate-500 text-sm">
                                Chưa có hoạt động nào
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t pb-safe pt-2 px-6 flex justify-between items-center z-20 pb-4">
                <Link href="/portal/dashboard" className="flex flex-col items-center gap-1 text-indigo-600">
                    <Home className="h-6 w-6 fill-current" />
                    <span className="text-[10px] font-medium">Trang chủ</span>
                </Link>
                <Link href="/portal/bills" className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors">
                    <FileText className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Hóa đơn</span>
                </Link>
                <Link href="/portal/incidents" className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors">
                    <Wrench className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Sự cố</span>
                </Link>
                <Link href="/portal/profile" className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors">
                    <User className="h-6 w-6" />
                    <span className="text-[10px] font-medium">Tài khoản</span>
                </Link>
            </nav>
        </div>
    );
}
