"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CreditCard, Banknote, QrCode } from "lucide-react";
import { formatCurrency } from "@/lib/billing";
import { UserPlan, PLANS } from "@/lib/plans";
import { toast } from "sonner";
import { upgradePlan } from "@/app/(dashboard)/dashboard/subscription/actions";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planKey: UserPlan;
    userId: string;
}

export function PaymentModal({ isOpen, onClose, planKey, userId }: PaymentModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("vnpay");

    const plan = PLANS[planKey];

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Execute server action
            await upgradePlan(userId, planKey);

            toast.success(`Nâng cấp gói ${plan.name} thành công!`);
            onClose();
        } catch (error) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại.");
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
                        Bạn đang nâng cấp lên gói <span className="font-bold text-foreground">{plan.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Tổng thanh toán</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(plan.price)}/tháng</span>
                    </div>

                    <div className="space-y-4">
                        <Label>Phương thức thanh toán</Label>
                        <RadioGroup defaultValue="vnpay" value={paymentMethod} onValueChange={setPaymentMethod}>
                            <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5">
                                <RadioGroupItem value="vnpay" id="vnpay" />
                                <Label htmlFor="vnpay" className="flex-1 cursor-pointer flex items-center gap-2">
                                    <div className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">VNPAY</div>
                                    <span>Ví VNPAY / App Ngân hàng</span>
                                </Label>
                                <QrCode className="h-5 w-5 text-muted-foreground" />
                            </div>

                            <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5">
                                <RadioGroupItem value="banking" id="banking" />
                                <Label htmlFor="banking" className="flex-1 cursor-pointer flex items-center gap-2">
                                    <Banknote className="h-5 w-5 text-green-600" />
                                    <span>Chuyên khoản ngân hàng</span>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-muted/50 opacity-50">
                                <RadioGroupItem value="card" id="card" disabled />
                                <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                                    <span>Thẻ quốc tế (Visa/Master)</span>
                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded ml-auto">Đang bảo trì</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-xs text-yellow-600 dark:text-yellow-400">
                        <p>ℹ️ Đây là giao dịch mô phỏng. Tài khoản của bạn sẽ được nâng cấp ngay lập tức sau khi xác nhận.</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Hủy</Button>
                    <Button onClick={handleConfirm} disabled={isLoading} className="min-w-[120px]">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {isLoading ? "Đang xử lý..." : "Thanh toán ngay"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
