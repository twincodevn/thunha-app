import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Shield, ShieldCheck, AlertTriangle, TrendingUp, Star, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const tenant = await prisma.tenant.findUnique({ where: { id }, select: { name: true } });
    return {
        title: tenant ? `Báo cáo tín dụng - ${tenant.name} | ThuNhà` : "Báo cáo tín dụng | ThuNhà",
        description: "Xem điểm tín nhiệm khách thuê được xác thực bởi ThuNhà",
    };
}

export default async function CreditReportPage({ params }: Props) {
    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
            creditScore: true,
            paymentHistory: true,
            createdAt: true,
            roomTenants: {
                where: { isActive: false },
                orderBy: { createdAt: "desc" },
                include: {
                    room: {
                        include: { property: { select: { name: true } } },
                    },
                },
                take: 5,
            },
        },
    });

    if (!tenant) notFound();

    const creditScore = tenant.creditScore || 600;
    const history = Array.isArray(tenant.paymentHistory) ? tenant.paymentHistory as any[] : [];

    let scoreLabel = "RỦI RO TRUNG BÌNH";
    let scoreColor = "text-yellow-500";
    let scoreBg = "bg-gradient-to-br from-yellow-400 to-orange-500";
    let Icon = TrendingUp;

    if (creditScore >= 750) {
        scoreLabel = "ĐÁNG TIN CẬY";
        scoreColor = "text-emerald-500";
        scoreBg = "bg-gradient-to-br from-emerald-400 to-teal-600";
        Icon = ShieldCheck;
    } else if (creditScore < 550) {
        scoreLabel = "RỦI RO CAO";
        scoreColor = "text-red-500";
        scoreBg = "bg-gradient-to-br from-red-400 to-rose-600";
        Icon = AlertTriangle;
    }

    const onTimePayments = history.filter((h) => h.pointsChange > 0).length;
    const latePayments = history.filter((h) => h.pointsChange < 0 && h.reason?.includes("trễ")).length;
    const totalMonths = tenant.roomTenants.reduce((sum: number, rt: any) => {
        if (!rt.endDate) return sum;
        const months = Math.max(0, Math.floor((new Date(rt.endDate).getTime() - new Date(rt.startDate || rt.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));
        return sum + months;
    }, 0);

    // Obfuscate phone: 09xx xxx xxx → 09** *** x87
    const phone = tenant.phone || "";
    const obfuscatedPhone = phone.length >= 10
        ? phone.slice(0, 2) + "** *** " + phone.slice(-3)
        : "***";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-4">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-4">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className="text-white/90 text-sm font-semibold">ThuNhà Credit™</span>
                    </div>
                    <p className="text-white/50 text-xs">Báo cáo tín dụng được xác thực</p>
                </div>

                {/* Main Card */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                    {/* Score Hero */}
                    <div className={`${scoreBg} p-8 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10 text-center">
                            <Icon className="h-8 w-8 text-white mx-auto mb-2 drop-shadow" />
                            <div className="text-7xl font-black text-white drop-shadow-lg tabular-nums">{creditScore}</div>
                            <div className="text-white/90 text-sm font-bold tracking-widest uppercase mt-2">{scoreLabel}</div>
                            <div className="flex justify-center gap-1 mt-4">
                                {[300, 450, 600, 750, 850].map((mark, i) => (
                                    <div key={mark} className={`h-2 flex-1 rounded-full ${creditScore >= mark ? "bg-white/80" : "bg-white/20"}`} />
                                ))}
                            </div>
                            <div className="flex justify-between text-[10px] text-white/60 mt-1">
                                <span>300</span><span>450</span><span>600</span><span>750</span><span>850</span>
                            </div>
                        </div>
                    </div>

                    {/* Tenant Info */}
                    <div className="bg-slate-900/95 backdrop-blur-xl p-6 space-y-6">
                        {/* Identity */}
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                                {tenant.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg">{tenant.name}</h2>
                                <p className="text-slate-400 text-sm">{obfuscatedPhone}</p>
                            </div>
                            <div className="ml-auto">
                                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Đã xác thực
                                </Badge>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-800/60 rounded-2xl p-3 text-center border border-slate-700/50">
                                <div className="text-2xl font-black text-white">{history.length}</div>
                                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">Giao dịch</div>
                            </div>
                            <div className="bg-emerald-500/10 rounded-2xl p-3 text-center border border-emerald-500/20">
                                <div className="text-2xl font-black text-emerald-400">{onTimePayments}</div>
                                <div className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wide mt-0.5">Đúng hạn</div>
                            </div>
                            <div className="bg-red-500/10 rounded-2xl p-3 text-center border border-red-500/20">
                                <div className="text-2xl font-black text-red-400">{latePayments}</div>
                                <div className="text-[10px] text-red-400/70 font-semibold uppercase tracking-wide mt-0.5">Trễ hạn</div>
                            </div>
                        </div>

                        {/* Payment History */}
                        {history.length > 0 && (
                            <div>
                                <h3 className="text-slate-300 text-sm font-bold mb-3 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-indigo-400" />
                                    Lịch sử điểm tín nhiệm
                                </h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {history.slice(-6).reverse().map((entry: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-3 py-2.5 border border-slate-700/30">
                                            <div className="flex items-center gap-2">
                                                {entry.pointsChange >= 0
                                                    ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                                    : <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                                                }
                                                <span className="text-slate-300 text-xs truncate max-w-[160px]">{entry.reason}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-xs font-bold ${entry.pointsChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                                    {entry.pointsChange >= 0 ? "+" : ""}{entry.pointsChange}
                                                </span>
                                                <span className="text-slate-500 text-xs">{entry.newScore}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rental History */}
                        {tenant.roomTenants.length > 0 && (
                            <div>
                                <h3 className="text-slate-300 text-sm font-bold mb-3 flex items-center gap-2">
                                    <Star className="h-4 w-4 text-amber-400" />
                                    Lịch sử thuê nhà
                                </h3>
                                <div className="space-y-2">
                                    {tenant.roomTenants.map((rt: any) => (
                                        <div key={rt.id} className="bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-700/30">
                                            <div className="text-slate-300 text-sm font-semibold">{rt.room.property.name}</div>
                                            <div className="text-slate-500 text-xs">Phòng {rt.room.roomNumber}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="border-t border-slate-700/50 pt-4">
                            <p className="text-center text-slate-500 text-[11px]">
                                Báo cáo được tạo bởi <span className="text-indigo-400 font-bold">ThuNhà™</span> · Dữ liệu được mã hoá & bảo vệ
                            </p>
                            <p className="text-center text-slate-600 text-[10px] mt-1">
                                Chỉ hiển thị số điện thoại đã ẩn danh · thunha.vn
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
