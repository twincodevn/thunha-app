"use client";

import { useState } from "react";
import Image from "next/image";
import { QrCode, Copy, Check, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getVietQRImageURL, getBankByCode, VIETQR_BANKS } from "@/lib/vietqr";
import { formatCurrency } from "@/lib/billing";

interface PaymentQRCodeProps {
    bankCode: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description?: string;
}

export function PaymentQRCode({
    bankCode,
    accountNumber,
    accountName,
    amount,
    description,
}: PaymentQRCodeProps) {
    const [copied, setCopied] = useState<string | null>(null);

    const bank = getBankByCode(bankCode);

    if (!bank) {
        return null;
    }

    const qrUrl = getVietQRImageURL({
        bankBin: bank.bin,
        accountNumber,
        accountName,
        amount,
        description,
    });

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                    <QrCode className="h-5 w-5" />
                    Quét mã QR để thanh toán
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl shadow-md">
                        <Image
                            src={qrUrl}
                            alt="VietQR Payment Code"
                            width={200}
                            height={200}
                            className="rounded-lg"
                            unoptimized // External image from VietQR.io
                        />
                    </div>
                </div>

                {/* Bank Info */}
                <div className="space-y-2 bg-white/80 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            Ngân hàng
                        </span>
                        <span className="font-medium">{bank.name}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Số tài khoản</span>
                        <div className="flex items-center gap-1">
                            <span className="font-mono font-medium">{accountNumber}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(accountNumber, "account")}
                            >
                                {copied === "account" ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Chủ tài khoản</span>
                        <span className="font-medium uppercase">{accountName}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground font-medium">Số tiền</span>
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-blue-600">{formatCurrency(amount)}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(amount.toString(), "amount")}
                            >
                                {copied === "amount" ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                    <Copy className="h-3 w-3" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                    Sử dụng app ngân hàng quét mã QR để thanh toán tự động
                </p>
            </CardContent>
        </Card>
    );
}

// Export banks list for use in settings form
export { VIETQR_BANKS };
