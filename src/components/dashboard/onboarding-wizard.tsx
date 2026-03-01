"use client";

import { useState, useEffect } from "react";
import { Building2, DoorOpen, Users, Receipt, CheckCircle2, ArrowRight, X, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import confetti from "canvas-confetti";

const ONBOARDING_KEY = "thunha-onboarding-dismissed";
const CONFETTI_KEY = "thunha-onboarding-confetti-fired";

interface OnboardingStep {
    icon: React.ReactNode;
    title: string;
    description: string;
    action: string;
    href: string;
    completed: boolean;
}

export function OnboardingWizard({
    hasProperties,
    hasRooms,
    hasTenants,
    hasBills,
}: {
    hasProperties: boolean;
    hasRooms: boolean;
    hasTenants: boolean;
    hasBills: boolean;
}) {
    const [dismissed, setDismissed] = useState(true);
    const [hasFiredConfetti, setHasFiredConfetti] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(ONBOARDING_KEY);
        if (!stored) setDismissed(false);

        const confettiFired = localStorage.getItem(CONFETTI_KEY);
        if (confettiFired) setHasFiredConfetti(true);
    }, []);

    if (dismissed) return null;

    const steps: OnboardingStep[] = [
        {
            icon: <Building2 className="h-5 w-5" />,
            title: "Tạo tòa nhà đầu tiên",
            description: "Thêm thông tin tòa nhà, địa chỉ và giá điện/nước",
            action: "Tạo tòa nhà",
            href: "/dashboard/properties/new",
            completed: hasProperties,
        },
        {
            icon: <DoorOpen className="h-5 w-5" />,
            title: "Thêm phòng cho thuê",
            description: "Cấu hình số phòng, giá thuê và tiện nghi",
            action: "Thêm phòng",
            href: "/dashboard/properties",
            completed: hasRooms,
        },
        {
            icon: <Users className="h-5 w-5" />,
            title: "Đăng ký khách thuê",
            description: "Thêm thông tin khách và gán vào phòng",
            action: "Thêm khách",
            href: "/dashboard/tenants/new",
            completed: hasTenants,
        },
        {
            icon: <Receipt className="h-5 w-5" />,
            title: "Tạo hóa đơn đầu tiên",
            description: "Nhập chỉ số điện/nước và tạo hóa đơn tự động",
            action: "Tạo hóa đơn",
            href: "/dashboard/billing/generate",
            completed: hasBills,
        },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    const progress = (completedCount / steps.length) * 100;
    const allDone = completedCount === steps.length;

    useEffect(() => {
        if (allDone && !hasFiredConfetti) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#8b5cf6', '#6366f1', '#3b82f6', '#10b981'],
            });
            setHasFiredConfetti(true);
            localStorage.setItem(CONFETTI_KEY, "1");
        }
    }, [allDone, hasFiredConfetti]);

    const handleDismiss = () => {
        localStorage.setItem(ONBOARDING_KEY, "1");
        setDismissed(true);
    };

    return (
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 dark:from-violet-950/40 dark:via-indigo-950/40 dark:to-blue-950/40">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-200/30 to-transparent rounded-full -translate-y-32 translate-x-32 dark:from-violet-800/20" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/30 to-transparent rounded-full translate-y-24 -translate-x-24 dark:from-blue-800/20" />

            <CardContent className="relative p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-foreground">
                                {allDone ? "🎉 Hoàn thành!" : "Bắt đầu với ThuNhà"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {allDone
                                    ? "Bạn đã sẵn sàng quản lý nhà trọ!"
                                    : `${completedCount}/${steps.length} bước hoàn thành`}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDismiss}
                        className="text-muted-foreground hover:text-foreground -mt-1 -mr-2"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-white/60 dark:bg-white/10 rounded-full overflow-hidden mb-6">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Steps */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className={`group relative rounded-xl p-4 transition-all duration-200 ${step.completed
                                ? "bg-white/50 dark:bg-white/5 border border-emerald-200 dark:border-emerald-800"
                                : "bg-white/70 dark:bg-white/10 border border-transparent hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-md"
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div
                                    className={`p-1.5 rounded-lg ${step.completed
                                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                                        : "bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400"
                                        }`}
                                >
                                    {step.completed ? <CheckCircle2 className="h-4 w-4" /> : step.icon}
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground">Bước {i + 1}</span>
                            </div>
                            <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{step.description}</p>
                            {!step.completed && (
                                <Button size="sm" variant="outline" className="w-full text-xs h-8 group-hover:bg-violet-50 dark:group-hover:bg-violet-950/30" asChild>
                                    <Link href={step.href}>
                                        {step.action}
                                        <ArrowRight className="ml-1 h-3 w-3" />
                                    </Link>
                                </Button>
                            )}
                            {step.completed && (
                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium text-center">
                                    ✓ Đã hoàn thành
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {allDone && (
                    <div className="mt-4 text-center">
                        <Button onClick={handleDismiss} className="bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white">
                            Tuyệt vời, bắt đầu quản lý!
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
