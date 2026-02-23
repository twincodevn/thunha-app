"use client";

import { Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlan, PLANS } from "@/lib/plans";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
    feature: string;
    requiredPlan: UserPlan;
    currentPlan: UserPlan;
    compact?: boolean;
    className?: string;
}

const PLAN_COLOR: Record<UserPlan, string> = {
    FREE: "slate",
    BASIC: "blue",
    PRO: "orange",
    BUSINESS: "purple",
};

export function UpgradePrompt({
    feature,
    requiredPlan,
    currentPlan,
    compact = false,
    className,
}: UpgradePromptProps) {
    const planConfig = PLANS[requiredPlan];
    const color = PLAN_COLOR[requiredPlan];

    if (compact) {
        return (
            <div
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm",
                    `border-${color}-300 bg-${color}-50 dark:border-${color}-800 dark:bg-${color}-950/30`,
                    className
                )}
            >
                <Lock className={`h-4 w-4 text-${color}-500 shrink-0`} />
                <span className={`text-${color}-700 dark:text-${color}-300`}>
                    <strong>{feature}</strong> yêu cầu gói{" "}
                    <strong>{planConfig.name}</strong>
                </span>
                <Link href="/dashboard/subscription" className="ml-auto shrink-0">
                    <Badge
                        className={`bg-${color}-500 hover:bg-${color}-600 text-white text-xs cursor-pointer`}
                    >
                        Nâng cấp
                    </Badge>
                </Link>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed text-center",
                `border-${color}-200 bg-gradient-to-b from-${color}-50 to-white dark:from-${color}-950/30 dark:to-transparent dark:border-${color}-800`,
                className
            )}
        >
            <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/50`}>
                <Lock className={`h-6 w-6 text-${color}-500`} />
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                    Tính năng dành riêng cho gói{" "}
                    <span className={`text-${color}-600 dark:text-${color}-400`}>
                        {planConfig.name}
                    </span>
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    <strong>{feature}</strong> không khả dụng ở gói{" "}
                    <strong>{PLANS[currentPlan].name}</strong>. Nâng cấp để sử dụng.
                </p>
            </div>
            <Link href="/dashboard/subscription">
                <Button
                    className={`bg-gradient-to-r from-${color}-500 to-${color}-600 hover:from-${color}-600 hover:to-${color}-700 text-white gap-2`}
                >
                    <Sparkles className="h-4 w-4" />
                    Nâng cấp lên {planConfig.name}
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </Link>
        </div>
    );
}
