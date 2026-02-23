"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, MessageSquareHeart, CheckCircle2 } from "lucide-react";
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
            <Card className="max-w-2xl border-green-100 bg-green-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <MessageSquareHeart className="w-32 h-32" />
                </div>
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                        <CardTitle className="text-xl text-green-700">Đã gửi đánh giá</CardTitle>
                    </div>
                    <CardDescription>Cảm ơn bạn đã chia sẻ trải nghiệm. Các góp ý của bạn sẽ giúp nhà trọ cải thiện dịch vụ tốt hơn.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn("w-5 h-5", star <= previousFeedback.rating ? "fill-yellow-400 text-yellow-400" : "fill-slate-100 text-slate-200")}
                                />
                            ))}
                        </div>
                        {previousFeedback.comment && (
                            <p className="text-slate-600 text-sm mt-3 border-l-2 border-slate-200 pl-3 italic">
                                "{previousFeedback.comment}"
                            </p>
                        )}
                        <p className="text-xs text-slate-400 mt-4 font-medium">
                            Đã gửi vào {format(new Date(previousFeedback.createdAt), "dd/MM/yyyy HH:mm")}
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full bg-white" onClick={() => {
                        setSubmitted(false);
                        setRating(previousFeedback.rating);
                        setComment(previousFeedback.comment || "");
                    }}>
                        Chỉnh sửa đánh giá mới
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (submitted) {
        return (
            <Card className="max-w-2xl text-center py-12 border-slate-200">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Cảm ơn bạn đã gửi đánh giá!</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Chúng tôi ghi nhận ý kiến của bạn để mang lại trải nghiệm sống tốt hơn.</p>
            </Card>
        );
    }

    return (
        <Card className="max-w-2xl border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle>Mức độ hài lòng của bạn</CardTitle>
                <CardDescription>
                    Bạn cảm thấy như thế nào về thời gian sinh sống tại {propertyName ? <strong className="text-slate-700">{propertyName}</strong> : "nhà trọ"}?
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col items-center py-6 gap-3">
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = hover >= star || rating >= star;
                            return (
                                <button
                                    key={star}
                                    type="button"
                                    className={cn("transition-all duration-200 rounded-full p-2 hover:bg-slate-50",
                                        isFilled ? "scale-110" : ""
                                    )}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    <Star className={cn("w-10 h-10 transition-colors",
                                        isFilled ? "fill-yellow-400 text-yellow-400" : "fill-slate-100 text-slate-200"
                                    )} />
                                </button>
                            );
                        })}
                    </div>
                    <span className="text-sm font-medium text-slate-500 h-5">
                        {rating === 1 && "Rất tệ"}
                        {rating === 2 && "Tệ"}
                        {rating === 3 && "Bình thường"}
                        {rating === 4 && "Tốt"}
                        {rating === 5 && "Rất tuyệt vời"}
                    </span>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Góp ý thêm (Không bắt buộc)</label>
                    <Textarea
                        placeholder="Có điều gì nhà trọ cần cải thiện không?"
                        rows={4}
                        className="resize-none"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    disabled={isSubmitting || !propertyId}
                    onClick={handleSubmit}
                >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <MessageSquareHeart className="h-5 w-5 mr-2" />}
                    Gửi đánh giá
                </Button>
            </CardFooter>
        </Card>
    );
}
