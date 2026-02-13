"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { confirmPayment } from "@/app/(dashboard)/dashboard/billing/actions";
import { formatCurrency } from "@/lib/billing";
import { useRouter } from "next/navigation";

interface ConfirmPaymentDialogProps {
    billId: string;
    remainingAmount: number;
    roomName: string;
    onSuccess?: () => void;
}

export function ConfirmPaymentDialog({
    billId,
    remainingAmount,
    roomName,
    onSuccess,
}: ConfirmPaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(remainingAmount.toString());
    const [method, setMethod] = useState<"CASH" | "BANK_TRANSFER">("CASH");
    const [note, setNote] = useState("");
    const router = useRouter();

    const handleConfirm = async () => {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error("Số tiền không hợp lệ");
            return;
        }

        setLoading(true);
        try {
            const result = await confirmPayment({
                billId,
                amount: parsedAmount,
                method,
                note,
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Đã ghi nhận thanh toán thành công");
                setOpen(false);
                router.refresh();
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi xử lý thanh toán");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm">
                    <Check className="mr-2 h-4 w-4" />
                    Xác nhận đã thu tiền
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Xác nhận thanh toán</DialogTitle>
                    <DialogDescription>
                        Ghi nhận khoản thu cho {roomName}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                            Số tiền
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Còn lại: {formatCurrency(remainingAmount)}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="method" className="text-right">
                            Hình thức
                        </Label>
                        <Select
                            value={method}
                            onValueChange={(val: "CASH" | "BANK_TRANSFER") => setMethod(val)}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Chọn hình thức" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Tiền mặt</SelectItem>
                                <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="note" className="text-right">
                            Ghi chú
                        </Label>
                        <Textarea
                            id="note"
                            className="col-span-3"
                            placeholder="Ví dụ: Đã nhận tiền mặt trực tiếp"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                        Hủy
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Xác nhận
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
