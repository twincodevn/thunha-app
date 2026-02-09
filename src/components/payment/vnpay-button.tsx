"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CreditCard, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/billing";
import { toast } from "sonner";

const BANK_OPTIONS = [
    { code: "", name: "Chọn ngân hàng/ví điện tử" },
    { code: "VNPAYQR", name: "Thanh toán QR Code" },
    { code: "VNBANK", name: "Thẻ ATM nội địa" },
    { code: "INTCARD", name: "Thẻ quốc tế (Visa, Master)" },
    { code: "VIETCOMBANK", name: "Vietcombank" },
    { code: "VIETINBANK", name: "Vietinbank" },
    { code: "BIDV", name: "BIDV" },
    { code: "AGRIBANK", name: "Agribank" },
    { code: "TECHCOMBANK", name: "Techcombank" },
    { code: "MBBANK", name: "MB Bank" },
    { code: "VPBANK", name: "VPBank" },
    { code: "TPBANK", name: "TPBank" },
    { code: "ACB", name: "ACB" },
    { code: "SHB", name: "SHB" },
    { code: "SACOMBANK", name: "Sacombank" },
];

interface VNPayButtonProps {
    billId: string;
    amount: number;
    disabled?: boolean;
}

export function VNPayButton({ billId, amount, disabled }: VNPayButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [bankCode, setBankCode] = useState("");

    async function handlePayment() {
        if (!bankCode) {
            toast.error("Vui lòng chọn phương thức thanh toán");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/payments/vnpay/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ billId, bankCode }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || "Không thể tạo thanh toán");
                return;
            }

            // Redirect to VNPay
            window.location.href = data.paymentUrl;
        } catch {
            toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                    disabled={disabled}
                >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Thanh toán VNPay
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Thanh toán qua VNPay</DialogTitle>
                    <DialogDescription>
                        Số tiền cần thanh toán: <strong>{formatCurrency(amount)}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Phương thức thanh toán</label>
                        <Select value={bankCode} onValueChange={setBankCode}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn ngân hàng/ví điện tử" />
                            </SelectTrigger>
                            <SelectContent>
                                {BANK_OPTIONS.map((bank) => (
                                    <SelectItem key={bank.code || "default"} value={bank.code || "select"}>
                                        {bank.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm text-amber-800">
                            ⚠️ Bạn sẽ được chuyển đến trang thanh toán VNPay. Sau khi thanh toán thành công,
                            bạn sẽ được chuyển về trang hóa đơn.
                        </p>
                    </div>
                    <Button onClick={handlePayment} disabled={isLoading} className="w-full">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Tiếp tục thanh toán
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
