"use client";

import { useEffect, useState } from "react";
import { AlertOctagon, CalendarClock, ZapOff, TrendingUp, X, Sparkles, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Insight {
    id: string;
    type: "ANOMALY" | "OPPORTUNITY" | "WARNING" | "INFO";
    title: string;
    description: string;
    actionLabel?: string;
    actionUrl?: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    icon: string;
}

const iconMap: Record<string, any> = {
    AlertOctagon,
    CalendarClock,
    ZapOff,
    TrendingUp
};

const typeStyles = {
    ANOMALY: "bg-orange-50 text-orange-900 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800",
    OPPORTUNITY: "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
    WARNING: "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800",
    INFO: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
};

export function SmartInsights({ insights: initialInsights }: { insights: Insight[] }) {
    const [insights, setInsights] = useState(initialInsights);
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!insights || insights.length === 0) return null;

    const handleDismiss = (id: string) => {
        setInsights(prev => prev.filter(i => i.id !== id));
        if (currentIndex >= insights.length - 1) {
            setCurrentIndex(Math.max(0, insights.length - 2));
        }
    };

    const currentInsight = insights[currentIndex];
    const Icon = iconMap[currentInsight.icon] || Sparkles;

    return (
        <div className="mb-6 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl opacity-30 blur group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-white dark:bg-slate-950 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-stretch min-h-[120px]">
                    {/* Left: AI Indicator */}
                    <div className="w-12 bg-gradient-to-b from-indigo-500 to-purple-600 flex flex-col items-center justify-center text-white p-2">
                        <Sparkles className="h-5 w-5 animate-pulse" />
                        <span className="text-[10px] font-bold mt-1 rotate-180 writing-vertical-rl">AI INSIGHT</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col justify-center relative">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                        currentInsight.type === "ANOMALY" ? "bg-orange-100 text-orange-700" :
                                            currentInsight.type === "WARNING" ? "bg-red-100 text-red-700" :
                                                currentInsight.type === "OPPORTUNITY" ? "bg-emerald-100 text-emerald-700" :
                                                    "bg-blue-100 text-blue-700"
                                    )}>
                                        {currentInsight.type}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{currentIndex + 1} / {insights.length}</span>
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                                    <Icon className="h-5 w-5" />
                                    {currentInsight.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                    {currentInsight.description}
                                </p>
                            </div>

                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-slate-400 hover:text-slate-600" onClick={() => handleDismiss(currentInsight.id)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {currentInsight.actionUrl && (
                            <div className="mt-4 flex items-center gap-3">
                                <Button size="sm" asChild className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 group/btn">
                                    <Link href={currentInsight.actionUrl}>
                                        {currentInsight.actionLabel || "Xem chi tiết"}
                                        <ArrowRight className="ml-2 h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                                {insights.length > 1 && (
                                    <div className="flex gap-1 ml-auto">
                                        {insights.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentIndex(idx)}
                                                className={cn("h-1.5 rounded-full transition-all duration-300",
                                                    idx === currentIndex ? "w-6 bg-indigo-500" : "w-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-indigo-300"
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
