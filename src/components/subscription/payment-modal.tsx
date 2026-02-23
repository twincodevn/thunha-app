"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, QrCode, Banknote, CreditCard, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/billing";
import { UserPlan, PLANS } from "@/lib/plans";
import { toast } from "sonner";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planKey: UserPlan;
    userId: string;
}

type PaymentMethod = "vnpay" | "banking";

export function PaymentModal({ isOpen, onClose, planKey }: PaymentModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vnpay");

    const plan = PLANS[planKey];

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            if (paymentMethod === "vnpay") {
                // Call the real VNPay subscription API
                const res = await fetch("/api/subscriptions/vnpay/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan: planKey }),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Không thể tạo liên kết thanh toán");
                }

                const { paymentUrl } = await res.json();
                // Redirect user to VNPay payment page
                window.location.href = paymentUrl;
            } else {
                // Banking transfer — show contact info and close
                toast.info("Vui lòng chuyển khoản theo thông tin bên dưới và liên hệ support@thunha.app để xác nhận.");
                onClose();
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Có lỗi xảy ra, vui lòng thử lại.";
            toast.error(msg);
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Xác nhận nâng cấp</DialogTitle>
                    <DialogDescription>
                        Bạn đang nâng cấp lên gói{" "}
                        <span className="font-bold text-foreground">{plan.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium">Tổng thanh toán</p>
                            <p className="text-xs text-muted-foreground">Gia hạn 30 ngày mỗi chu kỳ</p>
                        </div>
                        <span className="text-2xl font-bold text-primary">
                            {formatCurrency(plan.price)}/tháng
                        </span>
                    </div>

                    <div className="space-y-3">
                        <Label>Phương thức thanh toán</Label>
                        <RadioGroup
                            value={paymentMethod}
                            onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                        >
                            {/* VNPay option */}
                            <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5">
                                <RadioGroupItem value="vnpay" id="vnpay" />
                                <Label htmlFor="vnpay" className="flex-1 cursor-pointer flex items-center gap-2">
                                    <div className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                        VNPAY
                                    </div>
                                    <span>Ví VNPAY / App Ngân hàng / QR Code</span>
                                </Label>
                                <QrCode className="h-5 w-5 text-muted-foreground shrink-0" />
                            </div>

                            {/* Bank transfer option */}
                            <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5">
                                <RadioGroupItem value="banking" id="banking" />
                                <Label htmlFor="banking" className="flex-1 cursor-pointer flex items-center gap-2">
                                    <Banknote className="h-5 w-5 text-green-600" />
                                    <span>Chuyển khoản ngân hàng thủ công</span>
                                </Label>
                            </div>

                            {/* Disabled: card */}
                            <div className="flex items-center space-x-2 border p-4 rounded-lg opacity-50 cursor-not-allowed">
                                <RadioGroupItem value="card" id="card" disabled />
                                <Label htmlFor="card" className="flex-1 flex items-center gap-2 cursor-not-allowed">
                                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                                    <span>Thẻ quốc tế (Visa/Master)</span>
                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded ml-auto">
                                        Đang bảo trì
                                    </span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Bank transfer details  */}
                    {paymentMethod === "banking" && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg text-sm space-y-1.5 border">
                            <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                                Thông tin chuyển khoản
                            </p>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ngân hàng</span>
                                <span className="font-medium">Vietcombank</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Số tài khoản</span>
                                <span className="font-medium font-mono">1234567890</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Chủ tài khoản</span>
                                <span className="font-medium">CONG TY THUNHA</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nội dung CK</span>
                                <span className="font-medium font-mono text-primary">
                                    THUNHA {planKey}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground pt-1">
                                Sau khi chuyển khoản, email{" "}
                                <a
                                    href="mailto:support@thunha.app"
                                    className="underline text-primary"
                                >
                                    support@thunha.app
                                </a>{" "}
                                để được kích hoạt trong 24h.
                            </p>
                        </div>
                    )}

                    {paymentMethod === "vnpay" && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                            <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                            <p>
                                Bạn sẽ được chuyển đến trang thanh toán VNPay an toàn. Gói sẽ được kích hoạt ngay sau khi thanh toán thành công.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="min-w-[140px]"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {isLoading
                            ? "Đang xử lý..."
                            : paymentMethod === "vnpay"
                                ? "Thanh toán qua VNPay →"
                                : "Đã chuyển khoản"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
