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
    const [showDialog, setShowDialog] = useState(false);
    const [dialogContent, setDialogContent] = useState("");
    const [dialogTitle, setDialogTitle] = useState("");

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    const copyToClipboard = async (text: string, onSuccess: () => void) => {
        try {
            await navigator.clipboard.writeText(text);
            onSuccess();
        } catch (err) {
            // Fallback: Show dialog
            setDialogContent(text);
            setDialogTitle("Sao chép nội dung");
            setShowDialog(true);
        }
    };

    const handleCopyLink = () => {
        copyToClipboard(invoiceUrl, () => {
            setCopied(true);
            toast.success("Đã copy link hóa đơn!");
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const getSMSContent = () => `[ThuNhà] Thông báo tiền phòng T${billInfo.month}/${billInfo.year}

${billInfo.propertyName} - Phòng ${billInfo.roomNumber}
Tổng cộng: ${formatCurrency(billInfo.total)}

Xem chi tiết: ${invoiceUrl}

Vui lòng thanh toán trước ngày 10. Cảm ơn!`;

    const handleCopySMS = () => {
        copyToClipboard(getSMSContent(), () => {
            setSmsCopied(true);
            toast.success("Đã copy tin nhắn SMS!");
            setTimeout(() => setSmsCopied(false), 2000);
        });
    };

    const handleZaloShare = () => {
        const message = `📝 HÓA ĐƠN TIỀN PHÒNG - T${billInfo.month}/${billInfo.year}

🏠 ${billInfo.propertyName} - Phòng ${billInfo.roomNumber}
👤 Khách: ${billInfo.tenantName}
💰 Tổng cộng: ${formatCurrency(billInfo.total)}

🔗 Xem chi tiết: ${invoiceUrl}

Hạn đóng: Trước ngày 10.
---
Gửi từ ThuNhà`;

        // Always try to copy the message content first (better UX than just link)
        copyToClipboard(message, () => {
            toast.info("Đã copy nội dung. Đang mở Zalo...");
            window.open("https://chat.zalo.me/", "_blank");
        });
    };

    return (
        <>
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
                    Gửi qua Zalo (Copy & Mở Web)
                </Button>
            </div>

            {/* Fallback Dialog for non-secure contexts or failures */}
            {showDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-semibold">{dialogTitle}</h3>
                        <p className="text-sm text-muted-foreground">
                            Không thể tự động sao chép. Vui lòng sao chép thủ công bên dưới:
                        </p>
                        <textarea
                            className="w-full h-32 p-2 text-sm border rounded-md bg-muted"
                            readOnly
                            value={dialogContent}
                            onClick={(e) => e.currentTarget.select()}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowDialog(false)}>
                                Đóng
                            </Button>
                            <Button onClick={() => {
                                navigator.clipboard.writeText(dialogContent)
                                    .then(() => toast.success("Đã copy!"))
                                    .catch(() => toast.error("Vẫn không thể copy, hãy chọn và Ctrl+C"));
                            }}>
                                Thử lại
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
