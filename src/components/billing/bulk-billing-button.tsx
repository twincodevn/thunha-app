"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Loader2, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BulkBillResult {
    success: boolean;
    created: number;
    skipped: number;
    message: string;
    createdBills: Array<{
        id: string;
        roomNumber: string;
        propertyName: string;
        tenantName: string;
    }>;
    skippedRooms: Array<{
        roomNumber: string;
        propertyName: string;
        reason: string;
    }>;
}

export function BulkBillingButton() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<BulkBillResult | null>(null);

    // Default to current month
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [dueDate, setDueDate] = useState(
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-10`
    );

    const handleSubmit = async () => {
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch("/api/bills/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ month, year, dueDate }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Không thể tạo hóa đơn");
                return;
            }

            setResult(data);
            toast.success(data.message);
        } catch (_error) {
            toast.error("Đã xảy ra lỗi");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setResult(null);
        // Reload page if bills were created
        if (result?.created && result.created > 0) {
            window.location.reload();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Layers className="mr-2 h-4 w-4" />
                    Tạo hàng loạt
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tạo hóa đơn hàng loạt</DialogTitle>
                    <DialogDescription>
                        Tạo hóa đơn nháp cho tất cả phòng đang thuê trong tháng này.
                    </DialogDescription>
                </DialogHeader>

                {!result ? (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="month">Tháng</Label>
                                <Input
                                    id="month"
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="year">Năm</Label>
                                <Input
                                    id="year"
                                    type="number"
                                    min={2020}
                                    max={2030}
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Hạn thanh toán</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Hóa đơn sẽ được tạo ở trạng thái <strong>Nháp</strong>.
                            Bạn cần cập nhật chỉ số điện nước cho từng phòng.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-700">
                            <Check className="h-5 w-5" />
                            <span>Đã tạo {result.created} hóa đơn nháp</span>
                        </div>

                        {result.skipped > 0 && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 text-yellow-700">
                                <AlertCircle className="h-5 w-5" />
                                <span>Bỏ qua {result.skipped} phòng (chưa có chỉ số)</span>
                            </div>
                        )}

                        {result.createdBills.length > 0 && (
                            <div className="max-h-40 overflow-auto space-y-2">
                                {result.createdBills.map((bill) => (
                                    <div key={bill.id} className="text-sm p-2 rounded bg-muted">
                                        {bill.propertyName} - {bill.roomNumber} ({bill.tenantName})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {!result ? (
                        <>
                            <Button variant="outline" onClick={() => setOpen(false)}>
                                Hủy
                            </Button>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Tạo hóa đơn
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleClose}>Đóng</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
