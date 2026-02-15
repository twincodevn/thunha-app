"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2, TrendingUp, TrendingDown, ArrowRight, Check, BarChart3, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPriceSuggestion, applyPriceSuggestion } from "@/app/(dashboard)/dashboard/properties/[id]/rooms/actions";
import { formatCurrency } from "@/lib/billing";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PriceSuggestionAlertProps {
    roomId: string;
    currentPrice: number;
}

type AdjustmentFactor = {
    factor: string;
    impact: "increase" | "decrease";
    detail: string;
};

type SuggestionData = {
    suggestedPriceMin: number;
    suggestedPriceMax: number;
    marketAnalysis: string;
    confidence: "high" | "medium" | "low";
    adjustmentFactors: AdjustmentFactor[];
    competitivePosition: "below_average" | "average" | "above_average" | "premium";
};

const confidenceConfig = {
    high: { label: "Độ tin cậy cao", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Shield },
    medium: { label: "Độ tin cậy TB", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: BarChart3 },
    low: { label: "Tham khảo", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Zap },
};

const positionLabels: Record<string, string> = {
    below_average: "Dưới trung bình",
    average: "Trung bình",
    above_average: "Trên trung bình",
    premium: "Cao cấp",
};

export function PriceSuggestionAlert({ roomId, currentPrice }: PriceSuggestionAlertProps) {
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [suggestion, setSuggestion] = useState<SuggestionData | null>(null);

    const handleGetSuggestion = async () => {
        setLoading(true);
        try {
            const result = await getPriceSuggestion(roomId);
            if (result.success && result.data) {
                setSuggestion(result.data as SuggestionData);
            } else {
                toast.error(result.error || "Không thể lấy gợi ý lúc này");
            }
        } catch (error) {
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyPrice = async (price: number) => {
        setApplying(true);
        try {
            const result = await applyPriceSuggestion(roomId, price);
            if (result.success) {
                toast.success(`Đã cập nhật giá thành ${formatCurrency(price)}`);
                window.location.reload();
            } else {
                toast.error(result.error || "Không thể cập nhật giá");
            }
        } catch {
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setApplying(false);
        }
    };

    if (suggestion) {
        const avgPrice = Math.round((suggestion.suggestedPriceMin + suggestion.suggestedPriceMax) / 2);
        const diff = avgPrice - currentPrice;
        const diffPercent = currentPrice > 0 ? Math.round((diff / currentPrice) * 100) : 0;
        const conf = confidenceConfig[suggestion.confidence] || confidenceConfig.medium;
        const ConfIcon = conf.icon;

        // Price gauge calculation
        const gaugeMin = Math.min(currentPrice, suggestion.suggestedPriceMin) * 0.85;
        const gaugeMax = Math.max(currentPrice, suggestion.suggestedPriceMax) * 1.15;
        const range = gaugeMax - gaugeMin;
        const currentPos = range > 0 ? ((currentPrice - gaugeMin) / range) * 100 : 50;
        const sugMinPos = range > 0 ? ((suggestion.suggestedPriceMin - gaugeMin) / range) * 100 : 30;
        const sugMaxPos = range > 0 ? ((suggestion.suggestedPriceMax - gaugeMin) / range) * 100 : 70;

        return (
            <Card className="overflow-hidden border-0 shadow-lg">
                {/* Header gradient */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Sparkles className="h-5 w-5" />
                            <span className="font-bold text-lg">AI Price Intelligence</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={conf.color + " border-0 text-xs"}>
                                <ConfIcon className="h-3 w-3 mr-1" />
                                {conf.label}
                            </Badge>
                            <Badge className="bg-white/20 text-white border-0 text-xs">
                                {positionLabels[suggestion.competitivePosition] || "Trung bình"}
                            </Badge>
                        </div>
                    </div>
                </div>

                <CardContent className="p-5 space-y-5">
                    {/* Price comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="text-center p-3 rounded-xl bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Giá hiện tại</p>
                            <p className="text-lg font-bold">{formatCurrency(currentPrice)}</p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-800">
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">AI đề xuất</p>
                            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                                {formatCurrency(suggestion.suggestedPriceMin)} - {formatCurrency(suggestion.suggestedPriceMax)}
                            </p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">Chênh lệch</p>
                            <p className={`text-lg font-bold ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                                {diff > 0 ? "+" : ""}{diffPercent}%
                            </p>
                        </div>
                    </div>

                    {/* Price Gauge */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Biểu đồ so sánh giá</p>
                        <div className="relative h-8 bg-muted/30 rounded-full overflow-hidden">
                            {/* Suggested range */}
                            <div
                                className="absolute top-0 h-full bg-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full"
                                style={{ left: `${sugMinPos}%`, width: `${sugMaxPos - sugMinPos}%` }}
                            />
                            {/* Current price marker */}
                            <div
                                className="absolute top-0 h-full w-1 bg-foreground/70 rounded-full z-10"
                                style={{ left: `${currentPos}%` }}
                            />
                            <div
                                className="absolute -top-5 text-[10px] font-semibold text-foreground whitespace-nowrap"
                                style={{ left: `${currentPos}%`, transform: "translateX(-50%)" }}
                            >
                                Hiện tại
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                            <span>{formatCurrency(Math.round(gaugeMin))}</span>
                            <span>{formatCurrency(Math.round(gaugeMax))}</span>
                        </div>
                    </div>

                    {/* Market Analysis */}
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                        <p className="text-sm italic text-foreground/80">
                            &ldquo;{suggestion.marketAnalysis}&rdquo;
                        </p>
                    </div>

                    {/* Adjustment Factors */}
                    {suggestion.adjustmentFactors.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Yếu tố ảnh hưởng giá</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {suggestion.adjustmentFactors.map((f, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-start gap-2 p-2.5 rounded-lg text-sm ${f.impact === "increase"
                                                ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30"
                                                : "bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30"
                                            }`}
                                    >
                                        {f.impact === "increase" ? (
                                            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <p className={`font-medium text-xs ${f.impact === "increase"
                                                    ? "text-emerald-700 dark:text-emerald-400"
                                                    : "text-red-700 dark:text-red-400"
                                                }`}>
                                                {f.factor}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground truncate">{f.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Apply Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/50">
                        <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                            onClick={() => handleApplyPrice(avgPrice)}
                            disabled={applying}
                        >
                            {applying ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                                <Check className="h-4 w-4 mr-1" />
                            )}
                            Áp dụng giá {formatCurrency(avgPrice)}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleApplyPrice(suggestion.suggestedPriceMin)}
                            disabled={applying}
                        >
                            Áp dụng giá thấp ({formatCurrency(suggestion.suggestedPriceMin)})
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Initial state — invitation to analyze
    return (
        <Card className="overflow-hidden border border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/30 dark:to-purple-950/30">
            <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">AI Price Intelligence</p>
                        <p className="text-xs text-muted-foreground truncate">
                            Phân tích 11+ yếu tố để đề xuất giá tối ưu
                        </p>
                    </div>
                </div>
                <Button
                    size="sm"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shrink-0"
                    onClick={handleGetSuggestion}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            Đang phân tích...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4 mr-1" />
                            Phân tích ngay
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
