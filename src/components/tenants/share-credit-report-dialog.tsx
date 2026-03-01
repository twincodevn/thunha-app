"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Share2, CheckCircle2, ShieldCheck, AlertTriangle, TrendingUp } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ShareCreditReportDialogProps {
    tenant: any;
    isOpen: boolean;
    onClose: () => void;
}

export function ShareCreditReportDialog({ tenant, isOpen, onClose }: ShareCreditReportDialogProps) {
    const [copied, setCopied] = useState(false);

    if (!tenant) return null;

    const creditScore = tenant.creditScore || 600;

    let scoreColor = "text-yellow-500";
    let scoreBg = "bg-yellow-50 dark:bg-yellow-950/30";
    let scoreBorder = "border-yellow-200 dark:border-yellow-800";
    let scoreLabel = "RỦI RO TRUNG BÌNH";
    let scoreIcon = <TrendingUp className="h-5 w-5 text-yellow-500" />;

    if (creditScore >= 750) {
        scoreColor = "text-emerald-500";
        scoreBg = "bg-emerald-50 dark:bg-emerald-950/30";
        scoreBorder = "border-emerald-200 dark:border-emerald-800";
        scoreLabel = "ĐÁNG TIN CẬY";
        scoreIcon = <ShieldCheck className="h-5 w-5 text-emerald-500" />;
    } else if (creditScore < 550) {
        scoreColor = "text-red-500";
        scoreBg = "bg-red-50 dark:bg-red-950/30";
        scoreBorder = "border-red-200 dark:border-red-800";
        scoreLabel = "RỦI RO CAO (NỢ XẤU)";
        scoreIcon = <AlertTriangle className="h-5 w-5 text-red-500" />;
    }

    const shareUrl = `https://thunha.vn/report/${tenant.id}`;

    const handleCopy = () => {
        const text = `📊 BÁO CÁO TÍN DỤNG KHÁCH THUÊ 📊\nKhách hàng: ${tenant.name}\nĐiểm tín nhiệm: ${creditScore} - ${scoreLabel}\nXem chi tiết lịch sử thanh toán tại: ${shareUrl}\n---\nTham gia Cộng đồng ThuNhà để tra cứu rủi ro khách thuê miễn phí!`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Đã chép link báo cáo vào khay nhớ tạm!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md overflow-hidden bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-white/20 dark:border-zinc-800/50 shadow-2xl">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/20 to-transparent rounded-full -translate-y-32 translate-x-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/20 to-transparent rounded-full translate-y-24 -translate-x-24" />

                <DialogHeader className="relative z-10 text-center space-y-3">
                    <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                        Chia sẻ Báo cáo Tín dụng
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Tạo cảnh báo cho cộng đồng chủ trọ hoặc chia sẻ hồ sơ đẹp của khách hàng này.
                    </DialogDescription>
                </DialogHeader>

                <div className="relative z-10 flex border flex-col items-center justify-center p-6 mt-4 rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-inner border-white/50 dark:border-zinc-800/50">
                    <div className="flex items-center gap-3 mb-6 w-full justify-center">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                            <AvatarImage src={tenant.avatar || ""} />
                            <AvatarFallback className="text-sm bg-indigo-100 text-indigo-700">
                                {tenant.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{tenant.name}</h3>
                            <p className="text-xs text-muted-foreground">{tenant.phone.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3")}</p>
                        </div>
                    </div>

                    <div className={`flex flex-col items-center justify-center w-full p-6 rounded-2xl border ${scoreBg} ${scoreBorder} transition-all`}>
                        <div className="flex items-center gap-2 mb-2">
                            {scoreIcon}
                            <span className={`text-sm font-bold tracking-wider ${scoreColor}`}>{scoreLabel}</span>
                        </div>
                        <div className={`text-5xl font-black tabular-nums tracking-tighter ${scoreColor} drop-shadow-sm`}>
                            {creditScore}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">BỘ ĐIỂM TÍN NHIỆM THUNHÀ™</p>
                    </div>

                    <div className="mt-6 p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border">
                        <QRCode
                            value={shareUrl}
                            size={120}
                            bgColor="transparent"
                            fgColor="currentColor"
                            className="text-zinc-900 dark:text-zinc-100"
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-3 uppercase tracking-widest font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Dữ liệu được mã hóa & xác thực
                    </p>
                </div>

                <div className="relative z-10 grid gap-2 mt-2">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Share2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="w-full pl-9 pr-24 py-2.5 text-sm bg-muted/50 rounded-lg border text-muted-foreground truncate select-all">
                            {shareUrl}
                        </div>
                        <Button
                            className="absolute right-1 top-1 bottom-1 h-auto"
                            size="sm"
                            variant={copied ? "secondary" : "default"}
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Đã chép</>
                            ) : (
                                <><Copy className="h-4 w-4 mr-1.5" /> Copy Link</>
                            )}
                        </Button>
                    </div>
                </div>

                {/* VIRAL HOOK CTA */}
                <div className="relative z-10 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg p-3 text-center text-white shadow-md">
                    <p className="text-xs font-medium">✨ Khi có người đăng ký qua link này, bạn được tặng <span className="font-bold underline">1 THÁNG PRO MIỄN PHÍ</span>.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
