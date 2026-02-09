"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface ShareActionsProps {
    invoiceToken: string | undefined;
    invoiceUrl: string;
    billInfo: {
        tenantName: string;
        propertyName: string;
        roomNumber: string;
        month: number;
        year: number;
        total: number;
    };
}

export function ShareActions({ invoiceToken: _invoiceToken, invoiceUrl, billInfo }: ShareActionsProps) {
    const [copied, setCopied] = useState(false);
    const [smsCopied, setSmsCopied] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(invoiceUrl);
            setCopied(true);
            toast.success("Đã copy link hóa đơn!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Không thể copy link");
        }
    };

    const handleCopySMS = async () => {
        const smsMessage = `[ThuNhà] Thông báo tiền phòng T${billInfo.month}/${billInfo.year}

${billInfo.propertyName} - Phòng ${billInfo.roomNumber}
Tổng cộng: ${formatCurrency(billInfo.total)}

Xem chi tiết: ${invoiceUrl}

Vui lòng thanh toán trước ngày 10. Cảm ơn!`;

        try {
            await navigator.clipboard.writeText(smsMessage);
            setSmsCopied(true);
            toast.success("Đã copy tin nhắn SMS!");
            setTimeout(() => setSmsCopied(false), 2000);
        } catch {
            toast.error("Không thể copy");
        }
    };

    const handleZaloShare = () => {
        // Zalo sharing requires a public URL. Localhost will fail.
        const isLocalhost = invoiceUrl.includes("localhost") || invoiceUrl.includes("127.0.0.1");

        // Format message
        const message = `📝 HÓA ĐƠN TIỀN PHÒNG - T${billInfo.month}/${billInfo.year}

🏠 ${billInfo.propertyName} - Phòng ${billInfo.roomNumber}
👤 Khách: ${billInfo.tenantName}
💰 Tổng cộng: ${formatCurrency(billInfo.total)}

🔗 Xem chi tiết: ${invoiceUrl}

Hạn đóng: Trước ngày 10.
---
Gửi từ ThuNhà`;

        if (isLocalhost) {
            // Fallback for development: Copy message and open Zalo Web
            navigator.clipboard.writeText(message);
            window.open("https://chat.zalo.me/", "_blank");
            toast.info("Link localhost không thể chia sẻ trực tiếp. Đã copy nội dung, hãy dán vào Zalo!");
        } else {
            // Production: Use Zalo Share API
            const zaloShareUrl = `https://zalo.me/share?url=${encodeURIComponent(invoiceUrl)}&title=${encodeURIComponent(`Hóa đơn T${billInfo.month}/${billInfo.year} - ${formatCurrency(billInfo.total)}`)}`;
            window.open(zaloShareUrl, "_blank", "width=600,height=600");
            toast.success("Đang mở Zalo để chia sẻ...");
        }
    };

    return (
        <div className="space-y-3">
            <Button
                variant="outline"
                className="w-full"
                onClick={handleCopyLink}
            >
                {copied ? (
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                    <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? "Đã copy!" : "Copy link hóa đơn"}
            </Button>

            <Button
                variant="outline"
                className="w-full"
                onClick={handleCopySMS}
            >
                {smsCopied ? (
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                    <MessageSquare className="mr-2 h-4 w-4" />
                )}
                {smsCopied ? "Đã copy!" : "Copy tin nhắn SMS"}
            </Button>

            <Button
                variant="outline"
                className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                onClick={handleZaloShare}
            >
                <Share2 className="mr-2 h-4 w-4" />
                Gửi qua Zalo
            </Button>
        </div>
    );
}
