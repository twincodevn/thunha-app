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
import { QrCode, Copy, Check } from "lucide-react";
import { formatCurrency } from "@/lib/billing";
import { generateVietQRUrl } from "@/lib/vietqr-helper";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VietQRButtonProps {
    billId: string;
    amount: number;
    roomName: string;
    month: number;
    year: number;
    bankId?: string;
    accountNo?: string;
    accountName?: string;
    isOwner?: boolean; // New prop
}

export function VietQRButton({
    billId: _billId,
    amount,
    roomName,
    month,
    year,
    bankId = process.env.NEXT_PUBLIC_BANK_ID || "MB",
    accountNo = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NO || "",
    accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "",
    isOwner = false,
}: VietQRButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    // ... (keep generated qrUrl logic)
    const description = `TN-${_billId.slice(-6).toUpperCase()}`;

    const qrUrl = generateVietQRUrl({
        bankId,
        accountNo,
        amount,
        description,
        accountName,
        template: "print",
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã sao chép!");
    };

    if (!accountNo) {
        return (
            <Button
                variant="outline"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => toast.error("Chưa cấu hình tài khoản ngân hàng receiver")}
            >
                <QrCode className="mr-2 h-4 w-4" />
                {isOwner ? "Cấu hình tài khoản nhận tiền" : "Chưa có thông tin chuyển khoản"}
            </Button>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    className={`w-full text-white shadow-md transition-all hover:shadow-lg ${isOwner ? "bg-indigo-600 hover:bg-indigo-700" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    <QrCode className="mr-2 h-4 w-4" />
                    {isOwner ? "Lấy mã QR thu tiền" : "Thanh toán bằng VietQR"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold text-blue-700">
                        {isOwner ? "Mã QR Nhận Tiền" : "Quét mã để thanh toán"}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {isOwner
                            ? "Đưa mã này cho khách thuê để họ quét và thanh toán"
                            : "Sử dụng ứng dụng ngân hàng (Mobile Banking) để quét mã"}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    {/* QR Code Image Container */}
                    <div className="relative p-2 bg-white rounded-xl shadow-lg border border-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={qrUrl}
                            alt="VietQR Payment Code"
                            className="w-full max-w-[320px] object-contain rounded-lg"
                            loading="eager"
                        />
                    </div>

                    <div className="grid w-full gap-5 px-2">
                        {/* Account Info */}
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chủ tài khoản</Label>
                                    <div className="font-bold text-base text-gray-900 uppercase">{accountName || "CHƯA CẬP NHẬT TÊN"}</div>
                                </div>
                                <div className="text-right space-y-0.5">
                                    <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngân hàng</Label>
                                    <div className="font-bold text-base text-blue-600">{bankId}</div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-200">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Số tài khoản</Label>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="font-mono font-bold text-xl text-gray-900 tracking-wide">{accountNo}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                        onClick={() => copyToClipboard(accountNo)}
                                        title="Sao chép số tài khoản"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Details */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-200">
                                <span className="text-sm text-gray-600">Số tiền chuyển:</span>
                                <span className="font-bold text-xl text-blue-600">{formatCurrency(amount)}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Nội dung chuyển khoản:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 text-sm">{description}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-gray-400 hover:text-blue-600"
                                        onClick={() => copyToClipboard(description)}
                                        title="Sao chép nội dung"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
