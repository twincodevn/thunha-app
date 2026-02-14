"use client";

import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPriceSuggestion } from "@/app/(dashboard)/dashboard/properties/[id]/rooms/actions";
import { formatCurrency } from "@/lib/billing";
import { toast } from "sonner";

interface PriceSuggestionAlertProps {
    roomId: string;
    currentPrice: number;
}

export function PriceSuggestionAlert({ roomId, currentPrice }: PriceSuggestionAlertProps) {
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<{
        suggestedPriceMin: number;
        suggestedPriceMax: number;
        marketAnalysis: string;
    } | null>(null);

    const handleGetSuggestion = async () => {
        setLoading(true);
        try {
            const result = await getPriceSuggestion(roomId);
            if (result.success && result.data) {
                setSuggestion(result.data);
            } else {
                toast.error("Không thể lấy gợi ý lúc này");
            }
        } catch (error) {
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    if (suggestion) {
        return (
            <Alert className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <AlertTitle className="text-indigo-700 font-semibold flex items-center gap-2">
                    Gợi ý từ AI
                </AlertTitle>
                <AlertDescription className="mt-2 text-slate-700">
                    <p className="mb-2 italic">"{suggestion.marketAnalysis}"</p>
                    <div className="flex items-center gap-2 text-sm font-medium bg-white/50 p-2 rounded w-fit">
                        <span>Giá đề xuất:</span>
                        <span className="text-indigo-600">
                            {formatCurrency(suggestion.suggestedPriceMin)} - {formatCurrency(suggestion.suggestedPriceMax)}
                        </span>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <span className="text-sm text-indigo-700 font-medium">Bạn muốn tối ưu giá thuê phòng này?</span>
            </div>
            <Button
                variant="outline"
                size="sm"
                className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                onClick={handleGetSuggestion}
                disabled={loading}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "AI Phân tích ngay"}
            </Button>
        </div>
    );
}
