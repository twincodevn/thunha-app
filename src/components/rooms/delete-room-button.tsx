"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface DeleteRoomButtonProps {
    roomId: string;
    roomNumber: string;
    propertyId: string;
}

export function DeleteRoomButton({ roomId, roomNumber, propertyId }: DeleteRoomButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleDelete() {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/rooms/${roomId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Không thể xóa phòng");
            }

            toast.success("Đã xóa phòng thành công");
            router.push(`/dashboard/properties/${propertyId}`);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Đã xảy ra lỗi");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <ConfirmDialog
            trigger={
                <Button variant="destructive" disabled={isLoading}>
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Xóa phòng
                </Button>
            }
            title="Xác nhận xóa phòng"
            description={`Bạn có chắc muốn xóa Phòng ${roomNumber}? Tất cả dữ liệu liên quan (hóa đơn, thanh toán) cũng sẽ bị xóa. Hành động này không thể hoàn tác.`}
            confirmText="Xóa phòng"
            variant="destructive"
            onConfirm={handleDelete}
        />
    );
}
