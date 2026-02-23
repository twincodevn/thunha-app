"use client";

import { PLANS, UserPlan } from "@/lib/plans";
import { Check, X, Sparkles, Zap, Building2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useState, useEffect } from "react";
import { PaymentModal } from "@/components/subscription/payment-modal";
import { addDays, format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface SubscriptionClientProps {
    currentPlan: UserPlan;
    userId: string;
    planExpiresAt?: string | null;
}

const PLAN_ICONS: Record<UserPlan, React.ReactNode> = {
    FREE: <Star className="h-5 w-5 text-slate-400" />,
    BASIC: <Zap className="h-5 w-5 text-blue-500" />,
    PRO: <Sparkles className="h-5 w-5 text-orange-500" />,
    BUSINESS: <Building2 className="h-5 w-5 text-purple-500" />,
};

const PLAN_GRADIENT: Record<UserPlan, string> = {
    FREE: "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700",
    BASIC: "from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900",
    PRO: "from-orange-50 to-amber-100 dark:from-orange-950 dark:to-amber-900",
    BUSINESS: "from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900",
};

const PLAN_BORDER: Record<UserPlan, string> = {
    FREE: "border-slate-200 dark:border-slate-700",
    BASIC: "border-blue-200 dark:border-blue-800",
    PRO: "border-orange-300 dark:border-orange-700",
    BUSINESS: "border-purple-300 dark:border-purple-700",
};

const PLAN_BUTTON: Record<UserPlan, string> = {
    FREE: "bg-slate-600 hover:bg-slate-700 text-white",
    BASIC: "bg-blue-600 hover:bg-blue-700 text-white",
    PRO: "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-200 dark:shadow-orange-900 shadow-lg",
    BUSINESS: "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-purple-200 dark:shadow-purple-900 shadow-lg",
};

const COMPARISON_FEATURES = [
    { label: "Số phòng tối đa", free: "3", basic: "10", pro: "30", business: "Không giới hạn" },
    { label: "Tính tiền điện/nước", free: true, basic: true, pro: true, business: true },
    { label: "Hóa đơn PDF", free: false, basic: true, pro: true, business: true },
    { label: "Nhắc nợ tự động", free: false, basic: true, pro: true, business: true },
    { label: "Thu tiền VNPay/QR", free: false, basic: false, pro: true, business: true },
    { label: "AI Insights & Dự báo", free: false, basic: false, pro: true, business: true },
    { label: "Báo cáo tài chính nâng cao", free: false, basic: false, pro: true, business: true },
    { label: "Cổng Khách thuê (PWA)", free: true, basic: true, pro: true, business: true },
    { label: "API tích hợp bên ngoài", free: false, basic: false, pro: false, business: true },
    { label: "Hỗ trợ ưu tiên 1-1", free: false, basic: false, pro: true, business: true },
];

export function SubscriptionClient({ currentPlan, userId, planExpiresAt }: SubscriptionClientProps) {
    const [selectedPlan, setSelectedPlan] = useState<UserPlan | null>(null);
    const plans = Object.keys(PLANS) as UserPlan[];
    const searchParams = useSearchParams();

    useEffect(() => {
        const payment = searchParams.get("payment");
        const plan = searchParams.get("plan");
        const message = searchParams.get("message");

        if (payment === "success" && plan) {
            const planName = PLANS[plan as UserPlan]?.name ?? plan;
            toast.success(`🎉 Nâng cấp gói ${planName} thành công! Tính năng mới đã được kích hoạt.`, {
                duration: 6000,
            });
        } else if (payment === "failed") {
            toast.error(`Thanh toán thất bại: ${message ? decodeURIComponent(message) : "Vui lòng thử lại."}`, {
                duration: 6000,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    return (
        <DashboardShell className="space-y-10">
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-sm font-medium">
                    <Sparkles className="h-4 w-4" />
                    Nâng cấp để mở khoá toàn bộ sức mạnh
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Chọn gói phù hợp với bạn
                </h1>
                <p className="text-base text-slate-500 max-w-xl mx-auto">
                    Bắt đầu miễn phí, nâng cấp khi bạn phát triển. Không phí ẩn, không ràng buộc dài hạn.
                </p>

                {planExpiresAt && currentPlan !== "FREE" && (
                    <div className="inline-block px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-950 border border-green-200 text-green-700 text-sm">
                        ✅ Gói <strong>{PLANS[currentPlan].name}</strong> của bạn có hiệu lực đến{" "}
                        <strong>{format(new Date(planExpiresAt), "dd/MM/yyyy")}</strong>
                    </div>
                )}
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {plans.map((planKey) => {
                    const plan = PLANS[planKey];
                    const isCurrent = currentPlan === planKey;
                    const isPopular = planKey === "PRO";

                    return (
                        <div
                            key={planKey}
                            className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all duration-200 bg-gradient-to-b ${PLAN_GRADIENT[planKey]} ${PLAN_BORDER[planKey]} ${isPopular ? "scale-105 shadow-xl z-10" : "hover:shadow-md"} ${isCurrent ? "ring-2 ring-offset-2 ring-green-400" : ""}`}
                        >
                            {isPopular && (
                                <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                                    <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 px-3 py-1 shadow-md">
                                        ⭐ Phổ biến nhất
                                    </Badge>
                                </div>
                            )}
                            {isCurrent && (
                                <div className="absolute top-3 right-3">
                                    <Badge variant="outline" className="text-green-700 border-green-400 bg-green-50 text-xs">
                                        Đang dùng
                                    </Badge>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 rounded-xl bg-white/70 dark:bg-black/20 shadow-sm">
                                    {PLAN_ICONS[planKey]}
                                </div>
                                <span className="font-bold text-lg text-slate-800 dark:text-slate-100">{plan.name}</span>
                            </div>

                            <div className="mb-3">
                                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                                    {plan.price === 0 ? "0" : (plan.price / 1000).toLocaleString("vi-VN") + "k"}
                                </span>
                                <span className="text-sm text-slate-500 dark:text-slate-400"> ₫/tháng</span>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">{plan.description}</p>

                            <ul className="space-y-2.5 text-sm flex-1 mb-6">
                                <li className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                                    Tối đa {plan.maxRooms > 1000 ? "Không giới hạn" : plan.maxRooms} phòng
                                </li>
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`w-full ${PLAN_BUTTON[planKey]}`}
                                disabled={isCurrent}
                                onClick={() => plan.price > 0 && setSelectedPlan(planKey)}
                            >
                                {isCurrent ? "✓ Đang sử dụng" : plan.price === 0 ? "Bắt đầu miễn phí" : "Nâng cấp ngay →"}
                            </Button>
                        </div>
                    );
                })}
            </div>

            {/* Feature Comparison Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">So sánh tính năng chi tiết</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="text-left px-6 py-3 text-slate-500 font-medium w-1/3">Tính năng</th>
                                {plans.map(p => (
                                    <th key={p} className={`px-4 py-3 text-center font-semibold ${currentPlan === p ? "text-green-600" : "text-slate-700 dark:text-slate-300"}`}>
                                        {PLANS[p].name}
                                        {currentPlan === p && <span className="block text-xs font-normal text-green-500">Hiện tại</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {COMPARISON_FEATURES.map((row, i) => (
                                <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                    <td className="px-6 py-3 text-slate-700 dark:text-slate-300">{row.label}</td>
                                    {(["free", "basic", "pro", "business"] as const).map(p => {
                                        const val = row[p];
                                        return (
                                            <td key={p} className="px-4 py-3 text-center">
                                                {typeof val === "boolean"
                                                    ? val
                                                        ? <Check className="h-4 w-4 text-green-500 mx-auto" />
                                                        : <X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" />
                                                    : <span className="text-slate-600 dark:text-slate-400 font-medium">{val}</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
                Câu hỏi? Liên hệ <a href="mailto:support@thunha.app" className="underline hover:text-foreground">support@thunha.app</a> để được tư vấn miễn phí.
            </p>

            {selectedPlan && (
                <PaymentModal
                    isOpen={!!selectedPlan}
                    onClose={() => setSelectedPlan(null)}
                    planKey={selectedPlan}
                    userId={userId}
                />
            )}
        </DashboardShell>
    );
}
