"use client";

import { PLANS, UserPlan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";

const PLAN_ORDER: UserPlan[] = ["FREE", "BASIC", "PRO", "BUSINESS"];

function meetsRequirement(current: UserPlan, required: UserPlan): boolean {
    return PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(required);
}

interface PlanGateProps {
    requiredPlan: UserPlan;
    currentPlan: UserPlan;
    children: React.ReactNode;
    /** Custom label shown on the paywall card */
    featureName?: string;
}

export function PlanGate({ requiredPlan, currentPlan, children, featureName }: PlanGateProps) {
    if (meetsRequirement(currentPlan, requiredPlan)) {
        return <>{children}</>;
    }

    const required = PLANS[requiredPlan];

    return (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white/60 dark:bg-slate-900/60 dark:border-slate-800 backdrop-blur-sm">
            {/* Blurred preview of content */}
            <div className="blur-sm pointer-events-none select-none opacity-40 scale-95">
                {children}
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm p-6 text-center gap-4">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl shadow-lg">
                    <Lock className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                        {featureName ? `"${featureName}"` : "Tính năng này"} yêu cầu gói{" "}
                        <span className="text-orange-600">{required.name}</span>
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Nâng cấp để mở khoá và sử dụng đầy đủ tính năng cao cấp
                    </p>
                </div>
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md gap-2" asChild>
                    <Link href="/dashboard/subscription">
                        <Sparkles className="h-4 w-4" />
                        Nâng cấp lên {required.name} — {(required.price / 1000).toLocaleString("vi-VN")}.000₫/tháng
                    </Link>
                </Button>
            </div>
        </div>
    );
}
