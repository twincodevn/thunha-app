"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CheckoutButtonProps {
    tenantId: string;
    tenantName: string;
    roomInfo: string;
}

export function CheckoutButton({ tenantId, tenantName, roomInfo }: CheckoutButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleCheckout() {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/tenants/${tenantId}/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Không thể trả phòng");
                return;
            }

            toast.success("Trả phòng thành công!");
            router.refresh();
        } catch {
            toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                    )}
                    Trả phòng
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận trả phòng</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bạn có chắc muốn cho <strong>{tenantName}</strong> trả phòng <strong>{roomInfo}</strong>?
                        <br /><br />
                        ⚠️ Lưu ý: Nếu còn hóa đơn chưa thanh toán, bạn cần thanh toán trước khi trả phòng.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCheckout} className="bg-red-600 hover:bg-red-700">
                        Xác nhận trả phòng
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
