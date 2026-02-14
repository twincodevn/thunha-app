"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, HelpCircle, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/billing";
import { getRevenueForecast } from "@/app/(dashboard)/dashboard/actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function RevenueForecastCard() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        nextMonth: string;
        predictedRevenue: number;
        confidence: "low" | "medium" | "high";
        reasoning: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getRevenueForecast();
                if (result.error) {
                    setError(result.error);
                } else if (result.success && result.data) {
                    setData(result.data);
                }
            } catch (err) {
                setError("Không thể tải dự báo");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Card className="h-full border-indigo-100 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-500" /> Dự báo doanh thu
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </CardContent>
            </Card>
        );
    }

    if (error || !data) {
        return (
            <Card className="h-full border-dashed shadow-none bg-slate-50">
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">Dự báo doanh thu</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                    <p className="text-xs text-muted-foreground">Chưa đủ dữ liệu để dự báo.</p>
                </CardContent>
            </Card>
        );
    }

    const confidenceColor = {
        low: "text-red-500",
        medium: "text-yellow-500",
        high: "text-green-500",
    };

    const confidenceLabel = {
        low: "Thấp",
        medium: "Trung bình",
        high: "Cao",
    };

    return (
        <Card className="h-full border-indigo-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Sparkles className="h-16 w-16 text-indigo-500" />
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" /> Dự báo tháng {data.nextMonth}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold tracking-tight text-indigo-700">
                            {formatCurrency(data.predictedRevenue)}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Độ tin cậy:</span>
                        <span className={`font-medium ${confidenceColor[data.confidence]}`}>
                            {confidenceLabel[data.confidence]}
                        </span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="h-3 w-3 text-muted-foreground cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">{data.reasoning}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
