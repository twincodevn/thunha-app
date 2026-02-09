"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendBillEmail } from "@/app/(dashboard)/dashboard/billing/actions";

interface SendEmailButtonProps {
    billId: string;
    tenantEmail: string | null;
}

export function SendEmailButton({ billId, tenantEmail }: SendEmailButtonProps) {
    const [sending, setSending] = useState(false);

    const handleSendEmail = async () => {
        if (!tenantEmail) {
            toast.error("Khách thuê chưa có email. Vui lòng cập nhật thông tin khách thuê.");
            return;
        }

        setSending(true);
        try {
            const result = await sendBillEmail(billId);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || "Đã gửi email thành công!");
            }
        } catch (error) {
            console.error("Send email error:", error);
            toast.error("Lỗi khi gửi email");
        } finally {
            setSending(false);
        }
    };

    return (
        <Button
            variant="outline"
            className="w-full"
            onClick={handleSendEmail}
            disabled={sending || !tenantEmail}
        >
            {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Mail className="mr-2 h-4 w-4" />
            )}
            {sending ? "Đang gửi..." : "Gửi email"}
        </Button>
    );
}
