"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { sendReminderEmail, generateSMSMessage } from "@/app/(dashboard)/dashboard/billing/actions";

interface ReminderActionsProps {
    billId: string;
    tenantEmail: string | null;
    tenantPhone: string | null;
    isPaid: boolean;
}

export function ReminderActions({ billId, tenantEmail, tenantPhone, isPaid }: ReminderActionsProps) {
    const [sendingEmail, setSendingEmail] = useState(false);
    const [generatingSMS, setGeneratingSMS] = useState(false);

    const handleSendReminder = async () => {
        if (!tenantEmail) {
            toast.error("Khách thuê chưa có email");
            return;
        }

        if (isPaid) {
            toast.info("Hóa đơn đã thanh toán đủ, không cần nhắc nhở");
            return;
        }

        setSendingEmail(true);
        try {
            const result = await sendReminderEmail(billId);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || "Đã gửi nhắc nhở thành công!");
            }
        } catch (error) {
            console.error("Send reminder error:", error);
            toast.error("Lỗi khi gửi nhắc nhở");
        } finally {
            setSendingEmail(false);
        }
    };

    const handleCopySMS = async () => {
        if (!tenantPhone) {
            toast.error("Khách thuê chưa có số điện thoại");
            return;
        }

        setGeneratingSMS(true);
        try {
            const result = await generateSMSMessage(billId);

            if (result.error) {
                toast.error(result.error);
            } else if (result.message) {
                await navigator.clipboard.writeText(result.message);
                toast.success("Đã copy tin nhắn SMS! Gửi đến: " + result.phone);
            }
        } catch (error) {
            console.error("Generate SMS error:", error);
            toast.error("Lỗi khi tạo tin nhắn");
        } finally {
            setGeneratingSMS(false);
        }
    };

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Nhắc nhở thanh toán
            </p>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                    onClick={handleSendReminder}
                    disabled={sendingEmail || !tenantEmail || isPaid}
                >
                    {sendingEmail ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Bell className="mr-2 h-4 w-4" />
                    )}
                    Email
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={handleCopySMS}
                    disabled={generatingSMS || !tenantPhone}
                >
                    {generatingSMS ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <MessageSquare className="mr-2 h-4 w-4" />
                    )}
                    Copy SMS
                </Button>
            </div>
        </div>
    );
}
