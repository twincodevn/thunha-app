"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VietQRButton } from "@/components/payment/vietqr-button";
import { ConfirmPaymentDialog } from "@/components/billing/confirm-payment-dialog";
import { Share2, MessageSquare, MoreHorizontal, Printer, Download, Mail, Copy, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getBillSMSContent, getBillZaloContent, getZaloChatUrl } from "@/lib/billing";
import { Separator } from "@/components/ui/separator";

interface LandlordActionsProps {
    bill: {
        id: string;
        roomTenant: {
            room: {
                roomNumber: string;
                property: {
                    name: string;
                    user: {
                        bankName?: string | null;
                        bankAccountNumber?: string | null;
                        bankAccountName?: string | null;
                    };
                };
            };
            tenant: {
                name: string;
                email: string | null;
                phone: string;
            };
        };
        month: number;
        year: number;
        total: number;
        status: string;
        invoice?: {
            token: string;
        } | null;
    };
    remainingAmount: number;
}

export function LandlordActions({ bill, remainingAmount }: LandlordActionsProps) {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedSMS, setCopiedSMS] = useState(false);

    const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invoice/${bill.invoice?.token || bill.id}`;

    const billInfo = {
        month: bill.month,
        year: bill.year,
        propertyName: bill.roomTenant.room.property.name,
        roomNumber: bill.roomTenant.room.roomNumber,
        tenantName: bill.roomTenant.tenant.name,
        total: bill.total,
        invoiceUrl,
    };

    const handleZaloShare = () => {
        const message = getBillZaloContent(billInfo);
        navigator.clipboard.writeText(message);
        toast.info("Đã copy nội dung. Đang mở Zalo...");

        // Use direct link if phone number exists
        if (bill.roomTenant.tenant.phone) {
            const zaloUrl = getZaloChatUrl(bill.roomTenant.tenant.phone);
            window.open(zaloUrl, "_blank");
        } else {
            window.open("https://chat.zalo.me/", "_blank");
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(invoiceUrl);
        setCopiedLink(true);
        toast.success("Đã copy link hóa đơn");
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleCopySMS = () => {
        const message = getBillSMSContent(billInfo);
        navigator.clipboard.writeText(message);
        setCopiedSMS(true);
        toast.success("Đã copy tin nhắn SMS");
        setTimeout(() => setCopiedSMS(false), 2000);
    };

    return (
        <div className="space-y-4">
            {/* Primary Payment Actions */}
            {bill.status !== "PAID" && remainingAmount > 0 && (
                <div className="space-y-3">
                    <VietQRButton
                        billId={bill.id}
                        amount={remainingAmount}
                        roomName={`${bill.roomTenant.room.property.name} - ${bill.roomTenant.room.roomNumber}`}
                        month={bill.month}
                        year={bill.year}
                        bankId={bill.roomTenant.room.property.user.bankName || undefined}
                        accountNo={bill.roomTenant.room.property.user.bankAccountNumber || undefined}
                        accountName={bill.roomTenant.room.property.user.bankAccountName || undefined}
                        isOwner={true}
                    />

                    <ConfirmPaymentDialog
                        billId={bill.id}
                        remainingAmount={remainingAmount}
                        roomName={`${bill.roomTenant.room.property.name} - ${bill.roomTenant.room.roomNumber}`}
                    />
                </div>
            )}

            <Separator />

            {/* Communication Actions */}
            <div className="space-y-2">
                <Button
                    className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200"
                    variant="outline"
                    onClick={handleZaloShare}
                >
                    <Share2 className="mr-2 h-4 w-4" />
                    Gửi Zalo cho khách
                </Button>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleCopyLink}
                    >
                        {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        <span className="ml-2">Copy Link</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleCopySMS}
                    >
                        {copiedSMS ? <Check className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                        <span className="ml-2">Copy SMS</span>
                    </Button>
                </div>
            </div>

            {/* Secondary Actions Dropdown */}
            <div className="pt-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full text-muted-foreground">
                            <MoreHorizontal className="mr-2 h-4 w-4" />
                            Tùy chọn khác
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild>
                            <a href={`/api/invoices/${bill.id}/pdf`} download className="cursor-pointer">
                                <Download className="mr-2 h-4 w-4" />
                                Tải PDF
                            </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <a href={`/api/invoices/${bill.id}/pdf`} target="_blank" className="cursor-pointer">
                                <Printer className="mr-2 h-4 w-4" />
                                In hóa đơn
                            </a>
                        </DropdownMenuItem>
                        {/* Email logic would ideally be here too, but needs state. Keeping it simple for now */}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
