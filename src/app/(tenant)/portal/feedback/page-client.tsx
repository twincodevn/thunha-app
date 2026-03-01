"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, MessageSquareHeart, CheckCircle2, HeartHandshake } from "lucide-react";
import { submitTenantFeedback } from "@/app/actions/tenant-feedback-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function TenantFeedbackClient({
    tenantId,
    propertyId,
    propertyName,
    previousFeedback
}: {
    tenantId: string,
    propertyId?: string,
    propertyName?: string,
    previousFeedback?: any
}) {
    const [rating, setRating] = useState(5);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(!!previousFeedback);

    const handleSubmit = async () => {
        if (!propertyId) {
            toast.error("Không tìm thấy thông tin tòa nhà của bạn.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await submitTenantFeedback({
                tenantId,
                propertyId,
                rating,
                comment
            });

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Cảm ơn bạn đã gửi đánh giá!");
                setSubmitted(true);
            }
        } catch (e) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted && previousFeedback) {
        return (
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[32px] border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
                    <MessageSquareHeart className="w-48 h-48 text-emerald-600 dark:text-emerald-400" />
                </div>
                {/* Decorative mesh top */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-50/80 to-transparent dark:from-emerald-900/20 pointer-events-none" />

                <div className="relative z-10 p-7">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-2xl">
                            <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Đã gửi đánh giá</h2>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
                        Cảm ơn bạn đã chia sẻ trải nghiệm. Các góp ý của bạn sẽ giúp nhà trọ cải thiện dịch vụ tốt hơn.
                    </p>

                    <div className="bg-white/90 dark:bg-zinc-800/90 rounded-[24px] p-6 shadow-sm border border-slate-100 dark:border-zinc-700/50 mb-6 relative">
                        {/* Quote icon watermark */}
                        <div className="absolute top-4 right-4 text-6xl text-slate-100 dark:text-zinc-800 font-serif leading-none opacity-50 select-none">"</div>

                        <div className="flex gap-1.5 mb-4 relative z-10">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn("w-6 h-6", star <= previousFeedback.rating ? "fill-amber-400 text-amber-400 drop-shadow-sm" : "fill-slate-100 text-slate-200 dark:fill-zinc-700 dark:text-zinc-600")}
                                />
                            ))}
                        </div>
                        {previousFeedback.comment && (
                            <p className="text-slate-700 dark:text-zinc-300 text-[15px] font-medium leading-relaxed italic relative z-10">
                                {previousFeedback.comment}
                            </p>
                        )}
                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-zinc-700/50 flex items-center justify-between">
                            <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                                Đã gửi vào {format(new Date(previousFeedback.createdAt), "dd/MM/yyyy HH:mm")}
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full h-12 rounded-2xl bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-700 font-bold text-slate-700 dark:text-zinc-300 shadow-sm"
                        onClick={() => {
                            setSubmitted(false);
                            setRating(previousFeedback.rating);
                            setComment(previousFeedback.comment || "");
                        }}
                    >
                        Chỉnh sửa đánh giá
                    </Button>
                </div>
            </div>
        );
    }

    if (submitted && !previousFeedback) {
        return (
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[32px] border border-slate-200/50 dark:border-zinc-800/50 shadow-sm text-center py-16 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-900/10 pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="h-24 w-24 bg-emerald-100 dark:bg-emerald-500/20 rounded-[32px] flex items-center justify-center mb-6 shadow-inner rotate-3">
                        <HeartHandshake className="h-12 w-12 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Cảm ơn bạn!</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-sm leading-relaxed">
                        Chúng tôi đã ghi nhận đánh giá của bạn. Sự góp ý này sẽ giúp khu trọ mang lại trải nghiệm sống tốt hơn mỗi ngày.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[32px] border border-slate-200/50 dark:border-zinc-800/50 shadow-sm relative overflow-hidden">
            <div className="p-7">
                <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1.5">Mức độ hài lòng của bạn</h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 leading-relaxed">
                        Bạn cảm thấy như thế nào về thời gian sinh sống tại {propertyName ? <strong className="text-slate-700 dark:text-zinc-300">{propertyName}</strong> : "nhà trọ"}?
                    </p>
                </div>

                <div className="space-y-8">
                    <div className="flex flex-col items-center bg-slate-50/50 dark:bg-zinc-950/50 rounded-[24px] py-8 border border-slate-100/50 dark:border-zinc-800/50 shadow-inner">
                        <div className="flex justify-center gap-1.5 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => {
                                const isFilled = hover >= star || rating >= star;
                                return (
                                    <button
                                        key={star}
                                        type="button"
                                        className={cn("transition-all duration-300 rounded-full p-2 outline-none tap-highlight-transparent",
                                            isFilled ? "scale-110" : "hover:bg-slate-100 dark:hover:bg-zinc-800"
                                        )}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                    >
                                        <Star className={cn("w-12 h-12 transition-all duration-300",
                                            isFilled
                                                ? "fill-amber-400 text-amber-400 drop-shadow-md"
                                                : "fill-slate-200 text-slate-300 dark:fill-zinc-700 dark:text-zinc-600"
                                        )} />
                                    </button>
                                );
                            })}
                        </div>
                        <div className="bg-white dark:bg-zinc-800 px-4 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-zinc-700">
                            <span className="text-[13px] font-black tracking-wide text-slate-700 dark:text-zinc-300">
                                {rating === 1 && "Rất tệ 😞"}
                                {rating === 2 && "Tệ 😕"}
                                {rating === 3 && "Bình thường 😐"}
                                {rating === 4 && "Tốt 🙂"}
                                {rating === 5 && "Rất tuyệt vời 😍"}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[13px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 ml-1">Góp ý thêm (Không bắt buộc)</label>
                        <Textarea
                            placeholder="Có điều gì nhà trọ cần cải thiện không?"
                            rows={4}
                            className="resize-none rounded-2xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-visible:ring-indigo-500 focus-visible:ring-offset-0 text-[15px] p-4 font-medium placeholder:text-slate-400 shadow-sm"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="p-7 pt-0">
                <Button
                    className="w-full h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 hover:opacity-90 text-white font-bold text-[15px] shadow-[0_8px_16px_-4px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_20px_-8px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
                    disabled={isSubmitting || !propertyId}
                    onClick={handleSubmit}
                >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <MessageSquareHeart className="h-5 w-5 mr-2" strokeWidth={2.5} />}
                    Gửi đánh giá
                </Button>
            </div>
        </div>
    );
}
