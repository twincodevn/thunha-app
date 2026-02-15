"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Loader2, AlertTriangle, ExternalLink, Copy, Phone } from "lucide-react";
import { toast } from "sonner";
import { sendReminderEmail, generateSMSMessage } from "@/app/(dashboard)/dashboard/billing/actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface ReminderActionsProps {
    billId: string;
    tenantEmail: string | null;
    tenantPhone: string | null;
    isPaid: boolean;
}

// Remove Vietnamese diacritics for SMS/Zalo compatibility
function removeDiacritics(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
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

    const handleSMSAction = async (action: "copy" | "sms" | "zalo") => {
        if (!tenantPhone) {
            toast.error("Khách thuê chưa có số điện thoại");
            return;
        }

        setGeneratingSMS(true);
        try {
            const result = await generateSMSMessage(billId);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            if (!result.message) return;

            const cleanPhone = result.phone?.replace(/\s/g, "") || tenantPhone;
            const smsBody = removeDiacritics(result.message);

            switch (action) {
                case "copy":
                    await navigator.clipboard.writeText(result.message);
                    toast.success("Đã copy tin nhắn! Gửi đến: " + cleanPhone);
                    break;

                case "sms":
                    // Opens native SMS app with pre-filled message
                    window.open(`sms:${cleanPhone}?body=${encodeURIComponent(smsBody)}`, "_blank");
                    toast.success("Đang mở ứng dụng SMS...");
                    break;

                case "zalo":
                    // Zalo deep link - opens Zalo chat
                    // On mobile: opens Zalo app directly
                    // On desktop: opens Zalo web chat
                    const zaloPhone = cleanPhone.startsWith("0")
                        ? "84" + cleanPhone.slice(1)
                        : cleanPhone;
                    window.open(`https://zalo.me/${zaloPhone}`, "_blank");
                    // Also copy message so user can paste
                    await navigator.clipboard.writeText(result.message);
                    toast.success("Đang mở Zalo... Tin nhắn đã copy, hãy dán vào chat!");
                    break;
            }
        } catch (error) {
            console.error("SMS action error:", error);
            toast.error("Lỗi khi xử lý tin nhắn");
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
                    className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950"
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

                {/* SMS/Zalo Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
                            disabled={generatingSMS || !tenantPhone}
                        >
                            {generatingSMS ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <MessageSquare className="mr-2 h-4 w-4" />
                            )}
                            SMS / Zalo
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Chọn kênh gửi
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleSMSAction("zalo")}
                            className="cursor-pointer"
                        >
                            <ExternalLink className="mr-2 h-4 w-4 text-blue-500" />
                            <span>Gửi qua Zalo</span>
                            <span className="ml-auto text-[10px] text-muted-foreground">Phổ biến</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleSMSAction("sms")}
                            className="cursor-pointer"
                        >
                            <Phone className="mr-2 h-4 w-4 text-green-500" />
                            <span>Gửi SMS</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => handleSMSAction("copy")}
                            className="cursor-pointer"
                        >
                            <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Copy tin nhắn</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
